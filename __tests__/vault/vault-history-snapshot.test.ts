import { expect, test, vi } from "vitest";
import { Vault, type VaultHistorySnapshot } from "../../src/vault";
import { Vault4 } from "../../src/vault/vault4";
import { decodeValue, encodeValue } from "../../src/vault/history/values";

const canvas = { id: "c", type: "Canvas" as const };
const options = { metadata: ["authored"] };
function fixture(Class = Vault) {
  const vault = new Class({ history: options });
  vault.loadSync("c", { ...canvas, width: 100, height: 100, items: [] });
  return vault;
}
function json(snapshot: VaultHistorySnapshot): VaultHistorySnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

test.each([Vault, Vault4 as unknown as typeof Vault])(
  "JSON checkpoint restores both stacks and new edits use the receiving owner",
  (Class) => {
    const a = fixture(Class);
    a.modifyEntityField(canvas, "width", 200);
    a.modifyEntityField(canvas, "height", 300);
    expect(a.undo().ok).toBe(true);
    const saved = json(a.history!.exportSnapshot());
    const b = new Class({ history: options });
    b.history!.restoreSnapshot(saved);
    expect(b.get(canvas).width).toBe(200);
    expect(b.get(canvas).height).toBe(100);
    expect(b.history!.getState()).toMatchObject({ canUndo: true, canRedo: true });
    expect(b.redo().ok).toBe(true);
    expect(b.get(canvas).height).toBe(300);
    expect(b.undo().ok).toBe(true);
    expect(b.undo().ok).toBe(true);
    expect(b.get(canvas).width).toBe(100);
    b.modifyEntityField(canvas, "width", 400);
    expect(b.history!.getState().redo).toHaveLength(0);
    expect(b.undo().ok).toBe(true);
    expect(
      b.history!.getState().undo.every((g) => g.actorId === b.history!.actorId && g.sessionId === b.history!.sessionId)
    ).toBe(true);
  }
);

test("restoration keeps foreign ABA lineage conflicts blocked", () => {
  const a = fixture();
  a.modifyEntityField(canvas, "width", 200);
  a.dispatch(
    { type: "@iiif/MODIFY_ENTITY_FIELD", payload: { ...canvas, key: "width", value: 250 } },
    { actorId: "foreign" }
  );
  a.dispatch(
    { type: "@iiif/MODIFY_ENTITY_FIELD", payload: { ...canvas, key: "width", value: 200 } },
    { actorId: "foreign" }
  );
  expect(a.undo()).toMatchObject({ ok: false, conflict: "lineage" });
  const b = fixture();
  b.history!.restoreSnapshot(json(a.history!.exportSnapshot()));
  expect(b.undo()).toMatchObject({ ok: false, conflict: "lineage" });
  expect(b.get(canvas).width).toBe(200);
});

test("authored metadata and lossless patch values survive JSON; operational state does not", () => {
  const a = fixture();
  // Holes must remain distinct from explicit undefined after JSON persistence.
  // oxlint-disable-next-line unicorn/no-new-array
  const sparse = new Array(4);
  sparse[1] = undefined;
  sparse[2] = -0;
  sparse[3] = Infinity;
  a.setMetaValue(["c", "authored", "value"], { sparse, missing: undefined, nan: NaN });
  a.setMetaValue(["c", "@vault/task", "error"], new Error("operational"));
  const b = fixture();
  b.history!.restoreSnapshot(json(a.history!.exportSnapshot()));
  const value = b.getResourceMeta("c", "authored")!.value;
  expect(value.sparse).toStrictEqual(sparse);
  expect(Object.hasOwn(value, "missing")).toBe(true);
  expect(value.nan).toBeNaN();
  expect(b.getResourceMeta("c", "@vault/task")).toBeUndefined();
  expect(b.getState().iiif.requests).toEqual({});
  expect(b.undo().ok).toBe(true);
  expect(b.getResourceMeta("c", "authored")).toBeUndefined();
  expect(b.redo().ok).toBe(true);
  expect(b.getResourceMeta("c", "authored")!.value.sparse).toStrictEqual(sparse);
});

test("capture and restore reject live interactions; replacement invalidates old scopes", async () => {
  const a = fixture();
  const saved = a.history!.exportSnapshot();
  const interaction = a.beginInteraction();
  expect(() => a.history!.exportSnapshot()).toThrow(/active interaction/);
  expect(() => a.history!.restoreSnapshot(saved)).toThrow(/active interaction/);
  interaction.finish();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const pending = a.asyncBatch(async (scoped) => {
    await gate;
    scoped.modifyEntityField(canvas, "width", 500);
  });
  a.history!.restoreSnapshot(saved);
  release();
  await expect(pending).rejects.toThrow();
});

test("malformed, incompatible and policy-mismatched snapshots leave document and history unchanged", () => {
  const a = fixture();
  a.modifyEntityField(canvas, "width", 200);
  const saved = json(a.history!.exportSnapshot());
  const data = decodeValue(saved.data);
  const badPath = structuredClone(data);
  badPath.groups[0].commits[0].changes[0].path = ["iiif", "requests", "c"];
  const badRedo = structuredClone(data);
  badRedo.redoOrder = ["unknown"];
  const before = a.getState();
  const history = a.history!.getState();
  for (const corrupt of [
    null,
    {},
    { ...saved, version: 2 },
    { ...saved, data: ["invalid"] },
    { ...saved, data: encodeValue(badPath) },
    { ...saved, data: encodeValue(badRedo) },
  ]) {
    expect(() => a.history!.restoreSnapshot(corrupt as any)).toThrow(/snapshot/);
    expect(a.getState()).toBe(before);
    expect(a.history!.getState()).toEqual(history);
  }
  const b = new Vault({ history: true });
  expect(() => b.history!.restoreSnapshot(saved)).toThrow(/metadata policy/);
});

test("restoration applies destination retention and publishes one completed history notification", () => {
  const a = fixture();
  a.modifyEntityField(canvas, "width", 200);
  a.modifyEntityField(canvas, "height", 300);
  const b = new Vault({ history: { ...options, maxGroups: 1 } });
  const listener = vi.fn();
  b.history!.subscribe(listener);
  b.history!.restoreSnapshot(json(a.history!.exportSnapshot()));
  expect(listener).toHaveBeenCalledOnce();
  expect(b.history!.getState().undo).toHaveLength(1);
  expect(b.undo().ok).toBe(true);
  expect(b.get(canvas).height).toBe(100);
  expect(b.get(canvas).width).toBe(200);
});

test("deleted creation graphs and several redo entries survive a checkpoint", () => {
  const a = fixture();
  const scope = a.beginInteraction({ label: "Create painting graph" });
  scope.vault.loadSync("new-canvas", {
    id: "new-canvas",
    type: "Canvas",
    items: [
      {
        id: "page",
        type: "AnnotationPage",
        items: [
          {
            id: "annotation",
            type: "Annotation",
            motivation: "painting",
            target: "new-canvas",
            body: { id: "image", type: "Image" },
          },
        ],
      },
    ],
  });
  scope.finish();
  a.modifyEntityField(canvas, "width", 200);
  expect(a.undo().ok).toBe(true);
  expect(a.undo().ok).toBe(true);
  const b = fixture();
  b.history!.restoreSnapshot(json(a.history!.exportSnapshot()));
  expect(b.get({ id: "new-canvas", type: "Canvas" })).toBeNull();
  expect(b.redo().ok).toBe(true);
  expect(b.get({ id: "annotation", type: "Annotation" }).body).toEqual([{ id: "image", type: "ContentResource" }]);
  expect(b.get(canvas).width).toBe(100);
  expect(b.redo().ok).toBe(true);
  expect(b.get(canvas).width).toBe(200);
  expect(b.undo().ok).toBe(true);
  expect(b.undo().ok).toBe(true);
  expect(b.get({ id: "new-canvas", type: "Canvas" })).toBeNull();
});
