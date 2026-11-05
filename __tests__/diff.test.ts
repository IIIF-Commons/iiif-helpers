import { applyPatch, parsePatch, reversePatch } from "diff";
import { normalize } from "@iiif/parser";
import { describe, expect, test } from "vitest";
import {
  applyDiff,
  createDiffSession,
  diffNormalized,
  diffToUnifiedDiff,
  diffToVaultActions,
  mergeNormalized,
  DiffPreconditionError,
  resolveDiffConflict,
  serializeMergedResource,
  type DiffState,
} from "../src/diff";
import { createStore } from "../src/vault/store";
import { batchActions } from "../src/vault/actions";

const manifest = (label = "Before", items = ["a", "b"]): DiffState =>
  normalize({
    id: "https://example.org/m",
    type: "Manifest",
    label: { en: [label] },
    items: items.map((id) => ({ id: `https://example.org/${id}`, type: "Canvas", height: 100, width: 100, items: [] })),
  } as any);
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const root = "https://example.org/m";

describe("normalized diff", () => {
  test("reorder and edits remain separate, reversible and JSON portable", () => {
    const a = manifest(),
      b = manifest("After", ["b", "a"]);
    b.entities.Canvas["https://example.org/a"].width = 200;
    const diff = JSON.parse(JSON.stringify(diffNormalized(a, b)));
    expect(diff.changes.some((c: any) => c.kind === "reorder" && c.path[0] === "items")).toBe(true);
    expect(diff.changes.some((c: any) => c.resource.type === "Canvas" && c.path[0] === "width")).toBe(true);
    const result = applyDiff(a, diff);
    expect(result.entities).toEqual(b.entities);
    expect(result.mapping).toEqual(b.mapping);
    expect(applyDiff(result, diff, { direction: "reverse" }).entities).toEqual(a.entities);
    expect(a.entities.Manifest[root].label).toEqual({ en: ["Before"] });
  });
  test("unordered strategy suppresses reordering without hiding child edits", () => {
    const a = manifest(),
      b = manifest("Before", ["b", "a"]);
    b.entities.Canvas["https://example.org/a"].width = 200;
    const diff = diffNormalized(a, b, { arrayOrder: "unordered" });
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0].path).toEqual(["width"]);
  });
  test("ordering may be chosen per property", () => {
    expect(
      diffNormalized(manifest(), manifest("Before", ["b", "a"]), {
        arrayOrder: (path) => (path[0] === "items" ? "unordered" : "ordered"),
      }).changes
    ).toEqual([]);
  });
  test("ignores properties recursively and supports path filters", () => {
    const a = manifest(),
      b = manifest("After");
    b.entities.Canvas["https://example.org/a"].width = 200;
    expect(diffNormalized(a, b, { ignoreProperties: ["label", "width"] }).changes).toEqual([]);
    expect(diffNormalized(a, b, { ignore: (path) => path[0] === "label" }).changes).toHaveLength(1);
  });
  test("ignores inline ID values when comparing arrays", () => {
    const a = manifest(),
      b = copy(a);
    (a.entities.Manifest[root] as any).seeAlso = [{ id: "x", type: "Dataset" }];
    (b.entities.Manifest[root] as any).seeAlso = [{ id: "y", type: "Dataset" }];
    expect(diffNormalized(a, b, { ignoreIds: true }).changes).toEqual([]);
  });
  test("deletions differ from null and reverse restores missing fields", () => {
    const a = manifest(),
      b = copy(a);
    delete (b.entities.Manifest[root] as any).label;
    (b.entities.Manifest[root] as any).custom = null;
    const diff = JSON.parse(JSON.stringify(diffNormalized(a, b)));
    const next = applyDiff(a, diff);
    expect(Object.hasOwn(next.entities.Manifest[root], "label")).toBe(false);
    expect(next.entities.Manifest[root].custom).toBe(null);
    expect(applyDiff(next, diff, { direction: "reverse" }).entities).toEqual(a.entities);
  });
  test("checks stale edits but permits unrelated concurrent edits", () => {
    const a = manifest(),
      b = manifest("After"),
      concurrent = copy(a);
    concurrent.entities.Canvas["https://example.org/a"].width = 500;
    const diff = diffNormalized(a, b);
    expect(applyDiff(concurrent, diff).entities.Canvas["https://example.org/a"].width).toBe(500);
    expect(() => applyDiff(b, diff)).toThrow(DiffPreconditionError);
  });
  test("Vault actions produce exact additions, removals and reverse mutations", () => {
    const a = manifest(),
      b = manifest("After", ["a", "c"]);
    delete (b.entities.Manifest[root] as any).summary;
    const store = createStore();
    store.dispatch(
      batchActions({ actions: diffToVaultActions(store.getState(), diffNormalized(store.getState(), a)) })
    );
    const diff = diffNormalized(a, b);
    store.dispatch(batchActions({ actions: diffToVaultActions(store.getState(), diff) }));
    expect(diffNormalized(store.getState(), b).changes).toEqual([]);
    expect(store.getState().iiif.mapping).toEqual(b.mapping);
    expect(store.getState().iiif.entities.Canvas["https://example.org/b"]).toBeUndefined();
    store.dispatch(batchActions({ actions: diffToVaultActions(store.getState(), diff, { direction: "reverse" }) }));
    expect(diffNormalized(store.getState(), a).changes).toEqual([]);
    expect(store.getState().iiif.mapping).toEqual(a.mapping);
  });
  test("session excludes, includes and resets individual edits", () => {
    const a = manifest(),
      b = manifest("After", ["b", "a"]);
    const session = createDiffSession(a, b);
    const label = session.diff.changes.find((c) => c.path[0] === "label")!;
    session.exclude(label.id);
    expect(session.getState().entities.Manifest[root].label).toEqual({ en: ["Before"] });
    expect((session.toResource({ id: root, type: "Manifest" }) as any).items[0].id).toBe("https://example.org/b");
    session.include(label.id);
    expect(session.getState().entities.Manifest[root].label).toEqual({ en: ["After"] });
    session.exclude(label.id);
    session.reset();
    expect(session.getChangeIds()).toHaveLength(session.diff.changes.length);
  });
  test("merge combines disjoint changes and holds conflicting values", () => {
    const base = manifest(),
      local = manifest("Local"),
      remote = manifest("Remote");
    remote.entities.Canvas["https://example.org/a"].width = 200;
    const merged = mergeNormalized(base, local, remote);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.state.entities.Manifest[root].label).toEqual({ en: ["Local"] });
    expect(merged.state.entities.Canvas["https://example.org/a"].width).toBe(200);
  });
  test("identical edits do not conflict", () => {
    const base = manifest(),
      changed = manifest("Same");
    expect(mergeNormalized(base, changed, changed).conflicts).toEqual([]);
  });
  test("delete versus edit is a conflict", () => {
    const base = manifest(),
      local = copy(base),
      remote = copy(base);
    delete local.entities.Canvas["https://example.org/a"];
    delete local.mapping["https://example.org/a"];
    remote.entities.Canvas["https://example.org/a"].width = 200;
    const merged = mergeNormalized(base, local, remote);
    expect(merged.conflicts).toHaveLength(1);
    const resolved = resolveDiffConflict(merged.state, merged.conflicts[0], "remote");
    expect(resolved.entities.Canvas["https://example.org/a"].width).toBe(200);
    expect(resolved.mapping["https://example.org/a"]).toBe("Canvas");
  });
  test("serialized diff contains P3 JSON and contextual hunks", () => {
    const a = manifest(),
      b = manifest("After");
    const output = diffToUnifiedDiff(a, diffNormalized(a, b), { type: "Manifest", id: root });
    expect(output).toContain("--- a/");
    expect(output).toContain('-      "Before"');
    expect(output).toContain('+      "After"');
    expect(output).not.toContain("iiif-parser:");
    expect(diffToUnifiedDiff(a, diffNormalized(a, a), { type: "Manifest", id: root })).toBe("");
  });
  test("a single property edit changes only its line with three lines of context", () => {
    const a = manifest(),
      b = manifest("After");
    const patch = diffToUnifiedDiff(a, diffNormalized(a, b), { type: "Manifest", id: root });
    const [{ hunks }] = parsePatch(patch);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldLines).toBe(7);
    expect(hunks[0].newLines).toBe(7);
    expect(hunks[0].lines.filter((line) => line.startsWith("-"))).toEqual(['-      "Before"']);
    expect(hunks[0].lines.filter((line) => line.startsWith("+"))).toEqual(['+      "After"']);
    expect(hunks[0].lines.filter((line) => line.startsWith(" "))).toHaveLength(6);
    expect(patch).not.toContain('"height"');
  });
  test("distant edits form separate hunks and the patch applies in both directions", () => {
    const a = manifest(),
      b = manifest("After");
    b.entities.Canvas["https://example.org/b"].width = 200;
    const ref = { type: "Manifest", id: root };
    const text = (state: DiffState) => JSON.stringify(serializeMergedResource(state, ref), null, 2) + "\n";
    const patch = diffToUnifiedDiff(a, diffNormalized(a, b), ref);
    expect(parsePatch(patch)[0].hunks).toHaveLength(2);
    expect(applyPatch(text(a), patch)).toBe(text(b));
    expect(applyPatch(text(b), reversePatch(parsePatch(patch)[0]))).toBe(text(a));
    const backwards = diffToUnifiedDiff(b, diffNormalized(a, b), ref, { direction: "reverse" });
    expect(applyPatch(text(b), backwards)).toBe(text(a));
  });
  test("reordering and membership patches reproduce the serialized result", () => {
    const a = manifest("Before", ["a", "b", "c"]);
    const ref = { type: "Manifest", id: root };
    const text = (state: DiffState) => JSON.stringify(serializeMergedResource(state, ref), null, 2) + "\n";
    for (const b of [manifest("Before", ["b", "a", "c"]), manifest("Before", ["a", "d"])]) {
      const patch = diffToUnifiedDiff(a, diffNormalized(a, b), ref);
      expect(applyPatch(text(a), patch)).toBe(text(b));
      expect(applyPatch(text(b), reversePatch(parsePatch(patch)[0]))).toBe(text(a));
    }
  });
  test("whole resource creation and deletion patches apply correctly", () => {
    const empty: DiffState = { entities: {}, mapping: {} },
      full = manifest();
    const ref = { type: "Manifest", id: root },
      diff = diffNormalized(empty, full);
    const text = JSON.stringify(serializeMergedResource(full, ref), null, 2) + "\n";
    expect(applyPatch("", diffToUnifiedDiff(empty, diff, ref))).toBe(text);
    expect(applyPatch(text, diffToUnifiedDiff(full, diff, ref, { direction: "reverse" }))).toBe("");
  });
  test("zero context and session export options are supported", () => {
    const a = manifest(),
      b = manifest("After"),
      ref = { type: "Manifest", id: root };
    const patch = createDiffSession(a, b).toUnifiedDiff(ref, { contextLines: 0 });
    const hunk = parsePatch(patch)[0].hunks[0];
    expect(hunk.oldLines).toBe(1);
    expect(hunk.newLines).toBe(1);
    expect(hunk.lines).toHaveLength(2);
    for (const contextLines of [-1, 0.5, Infinity]) {
      expect(() => diffToUnifiedDiff(a, diffNormalized(a, b), ref, { contextLines })).toThrow("contextLines");
    }
  });
  test("conflicts support local, remote and custom decisions", () => {
    const base = manifest(),
      local = manifest("Local"),
      remote = manifest("Remote");
    const merged = mergeNormalized(base, local, remote);
    const conflict = merged.conflicts[0];
    expect(resolveDiffConflict(merged.state, conflict, "local").entities.Manifest[root].label.en).toEqual(["Local"]);
    expect(resolveDiffConflict(merged.state, conflict, "remote").entities.Manifest[root].label.en).toEqual(["Remote"]);
    expect(
      resolveDiffConflict(merged.state, conflict, { exists: true, value: ["Combined"] }).entities.Manifest[root].label
        .en
    ).toEqual(["Combined"]);
  });
  test("mapping-only changes are reversible", () => {
    const a = manifest(),
      b = copy(a);
    b.mapping.alias = "Manifest";
    const diff = diffNormalized(a, b);
    expect(diff.changes).toEqual([]);
    const result = applyDiff(a, diff);
    expect(result.mapping.alias).toBe("Manifest");
    expect(applyDiff(result, diff, { direction: "reverse" }).mapping).toEqual(a.mapping);
  });
  test("root additions and removals use /dev/null in text exports", () => {
    const empty: DiffState = { entities: {}, mapping: {} },
      full = manifest();
    const diff = diffNormalized(empty, full);
    expect(diffToUnifiedDiff(empty, diff, { type: "Manifest", id: root })).toMatch(/^--- \/dev\/null\n/);
    expect(diffToUnifiedDiff(full, diff, { type: "Manifest", id: root }, { direction: "reverse" })).toContain(
      "+++ /dev/null\n"
    );
  });
  test("unknown selections fail clearly", () => {
    expect(() =>
      applyDiff(manifest(), diffNormalized(manifest(), manifest("After")), { changeIds: ["missing"] })
    ).toThrow("Unknown change");
  });
});
