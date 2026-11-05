import { emptyAnnotationPage } from "@iiif/parser";
import { describe, expect, test, vi } from "vitest";
import { Vault, type VaultCommit } from "../../src/vault";
import { Vault4 } from "../../src/vault/vault4";
import * as actions from "../../src/vault/actions";
import { decodeValue, encodeValue } from "../../src/vault/history/values";

const ref = { id: "c", type: "Canvas" } as const;
function fixture(history: boolean | object = true, Class: typeof Vault = Vault) {
  const vault = new Class({ history, enableDevtools: false } as any);
  vault.dispatch(
    actions.importEntities({
      entities: {
        Canvas: {
          c: {
            id: "c",
            type: "Canvas",
            width: 100,
            height: 200,
            items: [
              { id: "a", type: "AnnotationPage" },
              { id: "b", type: "AnnotationPage" },
            ],
            metadata: [
              { label: { en: ["One"] }, value: { en: ["1"] } },
              { label: { en: ["Two"] }, value: { en: ["2"] } },
            ],
          },
          d: { id: "d", type: "Canvas", width: 100, height: 200, items: [] },
        } as any,
        AnnotationPage: {
          a: { ...emptyAnnotationPage, id: "a", type: "AnnotationPage", items: [] },
          b: { ...emptyAnnotationPage, id: "b", type: "AnnotationPage", items: [] },
        },
      },
    }),
    { history: "ignore" }
  );
  return vault;
}
const canvas = (vault: Vault) => vault.get<any>(ref);
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function roundTrip(vault: Vault, change: () => void) {
  const before = structuredClone(vault.getState().iiif);
  change();
  const after = structuredClone(vault.getState().iiif);
  expect(after).not.toStrictEqual(before);
  expect(vault.undo().ok).toBe(true);
  expect(vault.getState().iiif).toStrictEqual(before);
  expect(vault.redo().ok).toBe(true);
  expect(vault.getState().iiif).toStrictEqual(after);
}

describe("Vault batching and committed mutations", () => {
  test("publishes nested batches once and empty batches never", () => {
    const vault = fixture();
    const commits: VaultCommit[] = [];
    const observed: number[] = [];
    vault.subscribeCommits((commit) => commits.push(commit));
    vault.subscribe(
      (state) => state.iiif.entities.Canvas.c.width,
      (width) => observed.push(width),
      true
    );
    vault.batch(() => {
      vault.modifyEntityField(ref, "width", 101);
      vault.batch(() => vault.modifyEntityField(ref, "width", 102));
      expect(canvas(vault).width).toBe(100);
      vault.modifyEntityField(ref, "width", 103);
    });
    vault.batch(() => {});
    expect(observed).toEqual([103]);
    expect(commits).toHaveLength(1);
    expect(commits[0].actions).toHaveLength(3);
    expect(vault.history!.getState().undo).toHaveLength(1);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
  });

  test("a failed inner batch discards its savepoint; a failed outer batch publishes nothing", () => {
    const vault = fixture();
    vault.batch(() => {
      vault.modifyEntityField(ref, "width", 101);
      expect(() =>
        vault.batch(() => {
          vault.modifyEntityField(ref, "height", 999);
          throw new Error("inner");
        })
      ).toThrow("inner");
      vault.modifyEntityField(ref, "width", 102);
    });
    expect(canvas(vault).height).toBe(200);
    expect(() =>
      vault.batch(() => {
        vault.modifyEntityField(ref, "width", 999);
        vault.batch(() => vault.modifyEntityField(ref, "height", 999));
        throw new Error("outer");
      })
    ).toThrow("outer");
    expect(canvas(vault).width).toBe(102);
    vault.modifyEntityField(ref, "width", 103);
    expect(canvas(vault).width).toBe(103);
  });

  test("explicit nested batch actions and batchImport reduce recursively", () => {
    const vault = fixture();
    const state = { ...vault.getState().iiif, mapping: { alias: "Canvas" } };
    roundTrip(vault, () =>
      vault.dispatch(
        actions.batchActions({
          actions: [
            actions.batchImport({ state }),
            actions.batchActions({ actions: [actions.modifyEntityField({ ...ref, key: "width", value: 2 })] }),
          ],
        })
      )
    );
  });

  test("failed reducers publish no changes or history", () => {
    const vault = fixture({ metadata: ["editor"] });
    const before = vault.getState();
    expect(() =>
      vault.dispatch(
        actions.batchActions({
          actions: [
            actions.modifyEntityField({ ...ref, key: "width", value: 1 }),
            actions.metaActions.setMetaValueDynamic({
              id: "c",
              meta: "editor",
              key: "x",
              updateValue: () => {
                throw new Error("failure");
              },
            }),
          ],
        })
      )
    ).toThrow("failure");
    expect(vault.getState()).toBe(before);
    expect(vault.history!.getState().undo).toHaveLength(0);
  });

  test("history is finalized before state subscribers and reentrant commits stay ordered", () => {
    const vault = fixture();
    const commits: number[] = [];
    let historySeen = 0;
    let reacted = false;
    vault.subscribe(
      (state) => state.iiif.entities.Canvas.c.width,
      (width) => {
        historySeen = vault.history!.getState().undo.length;
        if (width === 101 && !reacted) {
          reacted = true;
          vault.modifyEntityField(ref, "width", 102);
        }
      },
      true
    );
    vault.subscribeCommits((commit) => commits.push(commit.after.iiif.entities.Canvas.c.width));
    vault.modifyEntityField(ref, "width", 101);
    expect(historySeen).toBe(2);
    expect(commits).toEqual([101, 102]);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(101);
  });

  test("direct store dispatches and state.dispatch are observed", () => {
    const vault = fixture();
    const listener = vi.fn();
    const unsubscribe = vault.subscribeCommits(listener);
    vault.getStore().dispatch(actions.modifyEntityField({ ...ref, key: "width", value: 1 }));
    vault
      .getStore()
      .getState()
      .dispatch(actions.modifyEntityField({ ...ref, key: "height", value: 2 }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(vault.history!.getState().undo).toHaveLength(2);
    unsubscribe();
    vault.modifyEntityField(ref, "width", 3);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("asyncBatch isolates its callback's Vault and invalidates escaped scopes", async () => {
    const vault = fixture();
    const wait = deferred();
    let escaped!: Vault;
    const batch = vault.asyncBatch(async (scoped) => {
      escaped = scoped;
      scoped.modifyEntityField(ref, "width", 101);
      await wait.promise;
      scoped.modifyEntityField(ref, "height", 201);
    });
    vault.modifyEntityField(ref, "label", { en: ["outside"] });
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).label).toEqual({ en: ["outside"] });
    wait.resolve();
    await batch;
    expect(vault.history!.getState().undo).toHaveLength(2);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).label).toEqual({ en: ["outside"] });
    expect(() => escaped.modifyEntityField(ref, "width", 999)).toThrow("closed");
  });

  test("failed async batches discard only their queued actions", async () => {
    const vault = fixture();
    await expect(
      vault.asyncBatch(async (scoped) => {
        scoped.modifyEntityField(ref, "width", 999);
        vault.modifyEntityField(ref, "height", 201);
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).height).toBe(201);
  });
});

describe("reversible reducer coverage", () => {
  const field = { ...ref, key: "items" };
  const cases: Array<[string, () => any]> = [
    ["field", () => actions.modifyEntityField({ ...ref, key: "width", value: 101 })],
    [
      "add reference",
      () => actions.addReference({ ...field, reference: { id: "x", type: "AnnotationPage" }, index: 1 }),
    ],
    ["remove reference", () => actions.removeReference({ ...field, reference: { id: "a", type: "AnnotationPage" } })],
    [
      "update reference",
      () =>
        actions.updateReference({
          ...field,
          reference: { id: "a", type: "AnnotationPage", label: { en: ["a"] } },
          index: 0,
        }),
    ],
    ["reorder reference", () => actions.reorderEntityField({ ...field, startIndex: 0, endIndex: 1 })],
    [
      "move entity",
      () =>
        actions.moveEntity({
          subject: { id: "a", type: "AnnotationPage" },
          from: field,
          to: { id: "d", type: "Canvas", key: "items" },
        }),
    ],
    [
      "move entities",
      () =>
        actions.moveEntities({
          subjects: { type: "slice", startIndex: 0, length: 2 },
          from: field,
          to: { id: "d", type: "Canvas", key: "items" },
        }),
    ],
    [
      "identifier",
      () =>
        actions.changeReferenceIdentifier({
          ...field,
          index: 0,
          reference: { id: "a", type: "AnnotationPage" },
          newIdentifier: "renamed",
        }),
    ],
    ["add metadata", () => actions.addMetadata({ ...ref, label: { en: ["New"] }, value: { en: ["Value"] } })],
    [
      "update metadata",
      () => actions.updateMetadata({ ...ref, atIndex: 0, label: { en: ["New"] }, value: { en: ["Value"] } }),
    ],
    ["remove metadata", () => actions.removeMetadata({ ...ref, atIndex: 0 })],
    ["reorder metadata", () => actions.reorderMetadata({ ...ref, startIndex: 0, endIndex: 1 })],
    [
      "merge import",
      () =>
        actions.importEntities({
          entities: { Canvas: { c: { id: "c", type: "Canvas", width: 101, label: { en: ["new"] } } } },
        } as any),
    ],
    ["exact entity", () => actions.setEntity({ ...ref, entity: { ...ref, width: 1 } })],
    ["delete entity", () => actions.setEntity({ type: "Canvas", id: "d", entity: undefined })],
    ["mapping", () => actions.addMapping({ id: "c", type: "Canvas" })],
    ["mappings", () => actions.addMappings({ mapping: { c: "Canvas", d: "Canvas" } })],
    ["exact mapping", () => actions.setMapping({ id: "c", type: "Canvas" })],
    ["meta value", () => actions.metaActions.setMetaValue({ id: "c", meta: "editor", key: "layout", value: { x: 1 } })],
    [
      "dynamic meta",
      () =>
        actions.metaActions.setMetaValueDynamic({
          id: "c",
          meta: "editor",
          key: "layout",
          updateValue: (old) => (old ?? 0) + 1,
        }),
    ],
  ];
  test.each(cases)("round-trips %s", (_, action) => {
    const vault = fixture({ metadata: ["editor"] });
    roundTrip(vault, () => vault.dispatch(action()));
  });

  test("preserves missing, undefined, null and overwritten destinations", () => {
    const vault = fixture();
    roundTrip(vault, () => vault.modifyEntityField(ref, "newField", undefined));
    roundTrip(vault, () => vault.modifyEntityField(ref, "newField", null));
    vault.dispatch(
      actions.setEntity({
        id: "renamed",
        type: "AnnotationPage",
        entity: { id: "renamed", type: "AnnotationPage", label: { en: ["old"] } },
      })
    );
    roundTrip(vault, () =>
      vault.dispatch(
        actions.changeReferenceIdentifier({
          ...ref,
          key: "items",
          index: 0,
          reference: { id: "a", type: "AnnotationPage" },
          newIdentifier: "renamed",
        })
      )
    );
  });

  test("records concrete dynamic metadata actions without rerunning functions on redo", () => {
    const vault = fixture({ metadata: ["editor"] });
    const update = vi.fn((old: number | undefined) => (old ?? 0) + 1);
    vault.dispatch(
      actions.batchActions({
        actions: [
          actions.metaActions.setMetaValueDynamic({ id: "c", meta: "editor", key: "x", updateValue: update }),
          actions.metaActions.setMetaValueDynamic({ id: "c", meta: "editor", key: "x", updateValue: update }),
        ],
      })
    );
    expect(vault.getResourceMeta("c", "editor").x).toBe(2);
    expect(update).toHaveBeenCalledTimes(2);
    expect(vault.history!.getState().undo[0].commits[0].actions[0].type).toBe(actions.SET_META_VALUE);
    expect(vault.undo().ok).toBe(true);
    expect(vault.redo().ok).toBe(true);
    expect(update).toHaveBeenCalledTimes(2);
  });

  test("creation/import/mappings/attachment undo as one unit", () => {
    const vault = fixture();
    roundTrip(vault, () =>
      vault.batch(() => {
        vault.dispatch(
          actions.importEntities({
            entities: {
              AnnotationPage: { new: { ...emptyAnnotationPage, id: "new", type: "AnnotationPage", items: [] } },
            },
          })
        );
        vault.dispatch(actions.addMapping({ id: "new", type: "AnnotationPage" }));
        vault.dispatch(
          actions.addReference({ ...ref, key: "items", reference: { id: "new", type: "AnnotationPage" } })
        );
      })
    );
  });

  test("supports Vault4 through the same engine", () => {
    const vault = new Vault4({ history: true });
    vault.loadSync("m", {
      id: "m",
      type: "Manifest",
      items: [{ id: "s", type: "Scene", width: 10, height: 10, items: [] }],
    });
    roundTrip(vault as any, () => vault.modifyEntityField({ id: "s", type: "Scene" }, "width", 20));
  });
});

describe("interaction grouping and conditional history", () => {
  test("side effects join the originating group across awaits, independent edits stay separate", async () => {
    const vault = fixture();
    const wait = deferred();
    const interaction = vault.interaction({ label: "Add image" }, async (scoped) => {
      scoped.modifyEntityField(ref, "width", 101);
      expect(vault.undo()).toEqual({ ok: false, reason: "open" });
      await wait.promise;
      scoped.modifyEntityField(ref, "height", 201);
    });
    vault.modifyEntityField(ref, "label", { en: ["unrelated"] });
    wait.resolve();
    await interaction;
    expect(vault.history!.getState().undo.map((group) => group.commits.length)).toEqual([2, 1]);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).label).toBeUndefined();
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).height).toBe(200);
    expect(vault.redo().ok).toBe(true);
    expect(vault.redo().ok).toBe(true);
  });

  test("nested interactions share a group and failures seal applied work", async () => {
    const vault = fixture();
    await expect(
      vault.interaction({ label: "outer" }, async (scoped) => {
        scoped.modifyEntityField(ref, "width", 101);
        await scoped.interaction({ label: "inner" }, (nested) => nested.modifyEntityField(ref, "height", 201));
        throw new Error("effect failed");
      })
    ).rejects.toThrow("effect failed");
    expect(vault.history!.getState().undo).toHaveLength(1);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).height).toBe(200);
  });

  test("interleaved overlapping groups cannot erase an intervening edit", () => {
    const vault = fixture();
    const a = vault.beginInteraction({ label: "A" });
    a.vault.modifyEntityField(ref, "width", 101);
    vault.modifyEntityField(ref, "width", 102);
    a.vault.modifyEntityField(ref, "width", 103);
    a.finish();
    const before = vault.getState();
    expect(vault.undo()).toMatchObject({ ok: false, reason: "conflict" });
    expect(vault.getState()).toBe(before);
  });

  test("repeated undo/redo restores lineage for earlier writes", () => {
    const vault = fixture();
    for (const value of [101, 102, 103]) vault.modifyEntityField(ref, "width", value);
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const expected of [102, 101, 100]) {
        expect(vault.undo().ok).toBe(true);
        expect(canvas(vault).width).toBe(expected);
      }
      for (const expected of [101, 102, 103]) {
        expect(vault.redo().ok).toBe(true);
        expect(canvas(vault).width).toBe(expected);
      }
    }
  });

  test("only owns local actor/session history and preserves unrelated foreign changes", () => {
    const vault = fixture({ actorId: "alice", sessionId: "tab1" });
    vault.modifyEntityField(ref, "width", 101);
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "height", value: 999 }), { actorId: "bob" });
    expect(vault.history!.getState().undo).toHaveLength(1);
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).height).toBe(999);
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "width", value: 101 }), {
      actorId: "alice",
      sessionId: "tab2",
    });
    expect(vault.redo()).toMatchObject({ ok: false, reason: "conflict" });
  });

  test("value equality cannot hide a foreign changed-and-changed-back edit", () => {
    const vault = fixture();
    vault.modifyEntityField(ref, "width", 101);
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "width", value: 102 }), { actorId: "bob" });
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "width", value: 101 }), { actorId: "bob" });
    expect(vault.history!.getState().canUndo).toBe(false);
    expect(vault.undo()).toMatchObject({ ok: false, reason: "conflict", conflict: "lineage" });
  });

  test("blocks entire groups when one field conflicts", () => {
    const vault = fixture();
    vault.batch(() => {
      vault.modifyEntityField(ref, "width", 101);
      vault.modifyEntityField(ref, "height", 201);
    });
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "height", value: 999 }), { history: "ignore" });
    const before = vault.getState();
    expect(vault.undo()).toMatchObject({ ok: false, reason: "conflict" });
    expect(vault.getState()).toBe(before);
    expect(canvas(vault).width).toBe(101);
  });

  test("protects a created entity from later edits, including changes made and reverted", () => {
    const vault = fixture();
    vault.dispatch(actions.setEntity({ id: "new", type: "Canvas", entity: { id: "new", type: "Canvas", width: 1 } }));
    vault.dispatch(actions.modifyEntityField({ id: "new", type: "Canvas", key: "width", value: 2 }), {
      actorId: "bob",
    });
    vault.dispatch(actions.modifyEntityField({ id: "new", type: "Canvas", key: "width", value: 1 }), {
      actorId: "bob",
    });
    expect(vault.undo()).toMatchObject({ ok: false, conflict: "lineage" });
  });

  test("protects created entities from foreign references and string targets", () => {
    for (const reference of [{ id: "new", type: "AnnotationPage" }, "new#xywh=0,0,1,1"]) {
      const vault = fixture();
      vault.dispatch(
        actions.setEntity({
          id: "new",
          type: "AnnotationPage",
          entity: { id: "new", type: "AnnotationPage", items: [], behavior: [] },
        })
      );
      vault.dispatch(actions.modifyEntityField({ ...ref, key: "seeAlso", value: [reference] }), { actorId: "bob" });
      expect(vault.undo()).toMatchObject({ ok: false, conflict: "reference" });
      expect(vault.get({ id: "new", type: "AnnotationPage" })).toBeTruthy();
    }
  });

  test("an unrelated foreign edit does not invalidate redo, new own edits do", () => {
    const vault = fixture();
    vault.modifyEntityField(ref, "width", 101);
    vault.undo();
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "height", value: 999 }), { actorId: "bob" });
    expect(vault.redo().ok).toBe(true);
    vault.undo();
    vault.modifyEntityField(ref, "label", { en: ["new branch"] });
    expect(vault.redo()).toEqual({ ok: false, reason: "empty" });
  });
});

describe("history policy and lifecycle", () => {
  test("history is opt-in, loading is excluded, authored scoped loading can be recorded", async () => {
    expect(fixture(false).undo()).toEqual({ ok: false, reason: "disabled" });
    const vault = new Vault({ history: true });
    vault.loadSync("c", { ...ref, width: 100, height: 100, items: [] });
    expect(vault.history!.getState().undo).toHaveLength(0);
    await vault.interaction({ label: "Import resource" }, (scoped) => {
      scoped.loadSync("new", { id: "new", type: "Canvas", width: 1, height: 1, items: [] });
    });
    expect(vault.history!.getState().undo).toHaveLength(1);
    expect(vault.undo().ok).toBe(true);
    expect(vault.get("new")).toBeNull();
    expect(vault.redo().ok).toBe(true);
    expect(vault.get("new")).toBeTruthy();
  });

  test("operational metadata, requests and semantic no-ops do not create undo entries", () => {
    const vault = fixture({ metadata: ["editor", "@vault/load"] });
    vault.modifyEntityField(ref, "width", 100);
    vault.setMetaValue(["c", "@vault/load", "error"], new Error("operational"));
    vault.setMetaValue(["c", "unlisted", "x"], 1);
    vault.dispatch(actions.requestResource({ id: "loading" }));
    vault.dispatch(actions.requestError({ id: "loading", message: "failed" }));
    vault.dispatch(actions.requestComplete({ id: "loading" }));
    expect(vault.history!.getState().undo).toHaveLength(0);
    roundTrip(vault, () => vault.setMetaValue(["c", "editor", "x"], 1));
  });

  test("retains immutable snapshots independent of action payload references", () => {
    const vault = fixture();
    const value = { en: ["one"] };
    vault.modifyEntityField(ref, "label", value);
    const history = vault.history!.getState();
    expect(Object.isFrozen(history.undo[0].commits[0].changes)).toBe(true);
    value.en[0] = "mutated outside dispatch";
    expect(vault.undo()).toMatchObject({ ok: false, conflict: "value" });
    expect((history.undo[0].commits[0].actions[0].payload as any).value.en).toEqual(["one"]);
  });

  test("state replacement clears history and invalidates open interactions", () => {
    const vault = fixture();
    const interaction = vault.beginInteraction({});
    interaction.vault.modifyEntityField(ref, "width", 101);
    vault.getStore().setState({ iiif: fixture(false).getState().iiif });
    expect(vault.undo()).toEqual({ ok: false, reason: "empty" });
    expect(() => interaction.vault.modifyEntityField(ref, "width", 999)).toThrow("closed");
  });

  test("retention removes whole groups, including redo entries", () => {
    const vault = fixture({ maxGroups: 2 });
    for (const width of [101, 102, 103]) vault.modifyEntityField(ref, "width", width);
    expect(vault.history!.getState().undo).toHaveLength(2);
    expect(vault.undo().ok).toBe(true);
    expect(vault.undo().ok).toBe(true);
    expect(vault.undo()).toEqual({ ok: false, reason: "empty" });
    expect(canvas(vault).width).toBe(101);
    const tiny = fixture({ maxBytes: 1 });
    tiny.modifyEntityField(ref, "width", 101);
    expect(tiny.history!.getState().undo).toHaveLength(0);
  });

  test("expired groups cannot accept late side effects", () => {
    vi.useFakeTimers();
    try {
      const vault = fixture({ maxAgeMs: 10 });
      const interaction = vault.beginInteraction({});
      interaction.vault.modifyEntityField(ref, "width", 101);
      vi.advanceTimersByTime(11);
      expect(() => interaction.vault.modifyEntityField(ref, "height", 999)).toThrow("expired");
      expect(vault.undo()).toEqual({ ok: false, reason: "empty" });
    } finally {
      vi.useRealTimers();
    }
  });

  test("unsupported custom reducer changes fail before publication", () => {
    const vault = new Vault({
      history: true,
      reducers: {
        custom: (state = 0, action: any) => (action.type === actions.MODIFY_ENTITY_FIELD ? state + 1 : state),
      },
      defaultState: { ...fixture(false).getState(), custom: 0 } as any,
    });
    const before = vault.getState();
    expect(() => vault.modifyEntityField(ref, "width", 101)).toThrow("custom state");
    expect(vault.getState()).toBe(before);
  });

  test("tagged values survive JSON without losing special or absent values", () => {
    const array: unknown[] = [];
    array.length = 3;
    array[1] = undefined;
    array[2] = -0;
    const value = { missingValue: undefined, nullValue: null, array, nan: NaN, infinity: Infinity };
    const result = decodeValue(JSON.parse(JSON.stringify(encodeValue(value))));
    expect(result).toEqual(value);
    expect(0 in result.array).toBe(false);
    expect(Object.hasOwn(result, "missingValue")).toBe(true);
  });
});

describe("history edge cases", () => {
  test("independent overlapping async batches publish only their own work", async () => {
    const vault = fixture();
    const a = deferred();
    const b = deferred();
    const first = vault.asyncBatch(async (scoped) => {
      scoped.modifyEntityField(ref, "width", 101);
      await a.promise;
    });
    const second = vault.asyncBatch(async (scoped) => {
      scoped.modifyEntityField(ref, "height", 201);
      await b.promise;
    });
    b.resolve();
    await second;
    expect(canvas(vault).width).toBe(100);
    expect(canvas(vault).height).toBe(201);
    a.resolve();
    await first;
    expect(vault.history!.getState().undo.map((g) => g.commits[0].changes.length)).toEqual([1, 1]);
  });

  test("a pending async batch cannot write into replaced state", async () => {
    const vault = fixture();
    const wait = deferred();
    const batch = vault.asyncBatch(async (scoped) => {
      scoped.modifyEntityField(ref, "width", 999);
      await wait.promise;
    });
    vault.getStore().setState({ iiif: fixture(false).getState().iiif });
    wait.resolve();
    await expect(batch).rejects.toThrow("replaced state");
    expect(canvas(vault).width).toBe(100);
    expect(vault.history!.getState().undo).toHaveLength(0);
  });

  test("replacing state within a batch discards stale queued actions", () => {
    const vault = fixture();
    expect(() =>
      vault.batch(() => {
        vault.modifyEntityField(ref, "width", 999);
        vault.getStore().setState({ iiif: fixture(false).getState().iiif });
      })
    ).toThrow("replaced during a batch");
    expect(canvas(vault).width).toBe(100);
  });

  test("replacing state with a throwing updater preserves history", () => {
    const vault = fixture();
    vault.modifyEntityField(ref, "width", 101);
    expect(() =>
      vault.getStore().setState(() => {
        throw new Error("bad updater");
      })
    ).toThrow("bad updater");
    expect(vault.undo().ok).toBe(true);
  });

  test("a full state replacement preserves the observed dispatch entry point", () => {
    const vault = fixture();
    vault.getStore().setState({ iiif: fixture(false).getState().iiif } as any, true);
    vault
      .getStore()
      .getState()
      .dispatch(actions.modifyEntityField({ ...ref, key: "width", value: 101 }));
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
  });

  test("reset notifications see the replaced document and cleared history", () => {
    const vault = fixture();
    vault.modifyEntityField(ref, "width", 101);
    const observed: number[] = [];
    vault.history!.subscribe(() => observed.push(canvas(vault).width));
    vault.getStore().setState({ iiif: fixture(false).getState().iiif });
    expect(observed).toEqual([100]);
  });

  test("metadata undo preserves operational namespaces and empty existing containers", () => {
    const vault = fixture({ metadata: ["editor"] });
    vault.setMetaValue(["c", "@vault/load", "report"], { ok: true });
    roundTrip(vault, () => vault.setMetaValue(["c", "editor", "layout"], undefined));
    expect(vault.getResourceMeta("c", "@vault/load")).toEqual({ report: { ok: true } });
    const state = vault.getState().iiif;
    vault.getStore().setState({ iiif: { ...state, meta: { c: { editor: {} } } } });
    roundTrip(vault, () => vault.setMetaValue(["c", "editor", "layout"], { x: 1 }));
  });

  test("unset metadata and exact mapping deletion round-trip", () => {
    const vault = fixture({ metadata: ["editor"] });
    vault.setMetaValue(["c", "editor", "x"], 1);
    roundTrip(vault, () => vault.dispatch(actions.metaActions.unsetMetaValue({ id: "c", meta: "editor", key: "x" })));
    vault.dispatch(actions.addMapping({ id: "c", type: "Canvas" }));
    roundTrip(vault, () => vault.dispatch(actions.setMapping({ id: "c", type: undefined })));
  });

  test("same-parent and list-based moves round-trip", () => {
    const vault = fixture();
    roundTrip(vault, () =>
      vault.dispatch(
        actions.moveEntity({
          subject: { id: "a", type: "AnnotationPage" },
          from: { ...ref, key: "items" },
          to: { ...ref, key: "items", index: 1 },
        })
      )
    );
    roundTrip(vault, () =>
      vault.dispatch(
        actions.moveEntities({
          subjects: { type: "list", items: [{ id: "b", type: "AnnotationPage" }] },
          from: { ...ref, key: "items" },
          to: { id: "d", type: "Canvas", key: "items" },
        })
      )
    );
  });

  test("persistent metadata references protect newly created entities", () => {
    const vault = fixture({ metadata: ["layout"] });
    vault.dispatch(
      actions.setEntity({ id: "new", type: "AnnotationPage", entity: { id: "new", type: "AnnotationPage", items: [] } })
    );
    vault.dispatch(
      actions.metaActions.setMetaValue({ id: "c", meta: "layout", key: "annotationIds", value: ["new"] }),
      { actorId: "bob" }
    );
    expect(vault.undo()).toMatchObject({ ok: false, conflict: "reference" });
  });

  test("redo deletion checks newly acquired dependencies", () => {
    const vault = fixture();
    vault.dispatch(actions.setEntity({ id: "d", type: "Canvas", entity: undefined }));
    expect(vault.undo().ok).toBe(true);
    vault.dispatch(actions.modifyEntityField({ ...ref, key: "seeAlso", value: [{ id: "d", type: "Canvas" }] }), {
      actorId: "bob",
    });
    expect(vault.redo()).toMatchObject({ ok: false, conflict: "reference" });
    expect(vault.get({ id: "d", type: "Canvas" })).toBeTruthy();
  });

  test("capacity eviction does not split an interaction or interrupt its work", async () => {
    const vault = fixture({ maxBytes: 1 });
    await vault.interaction({ label: "too large" }, async (scoped) => {
      scoped.modifyEntityField(ref, "width", 101);
      await Promise.resolve();
      scoped.modifyEntityField(ref, "height", 201);
    });
    expect(canvas(vault).width).toBe(101);
    expect(canvas(vault).height).toBe(201);
    expect(vault.history!.getState().undo).toHaveLength(0);
  });

  test("clear/dispose invalidate escaped contexts and dispose stops recording", () => {
    const vault = fixture();
    const first = vault.beginInteraction();
    vault.history!.clear();
    expect(() => first.vault.modifyEntityField(ref, "width", 999)).toThrow("closed");
    const second = vault.beginInteraction();
    vault.history!.dispose();
    expect(() => second.vault.modifyEntityField(ref, "width", 999)).toThrow("closed");
    vault.modifyEntityField(ref, "width", 101);
    expect(vault.history!.getState().undo).toHaveLength(0);
  });

  test("unsupported values and cyclic changes fail atomically", () => {
    const vault = fixture();
    const value: any = {};
    value.self = value;
    for (const invalid of [value, new Date(), () => 1]) {
      const before = vault.getState();
      expect(() => vault.modifyEntityField(ref, "unsupported", invalid)).toThrow("Vault history");
      expect(vault.getState()).toBe(before);
    }
  });

  test("conditional patch actions cannot write custom state or publish partially", () => {
    const vault = fixture();
    const change = {
      path: ["iiif", "entities", "Canvas", "c", "width"],
      before: { exists: true, value: encodeValue(100) },
      after: { exists: true, value: encodeValue(101) },
    } as const;
    expect(() =>
      vault.dispatch(actions.applyHistory({ direction: "redo", changes: [change, { ...change, path: ["custom"] }] }))
    ).toThrow("Invalid Vault");
    expect(canvas(vault).width).toBe(100);
    vault.modifyEntityField(ref, "width", 102);
    expect(() => vault.dispatch(actions.applyHistory({ direction: "redo", changes: [change] }))).toThrow(
      "history conflict"
    );
    expect(canvas(vault).width).toBe(102);
  });

  test("undo availability notifications are computed from published state", () => {
    const vault = fixture();
    const observed: boolean[] = [];
    const stop = vault.history!.subscribe((state) => observed.push(state.canUndo));
    vault.modifyEntityField(ref, "width", 101);
    vault.undo();
    stop();
    expect(observed).toEqual([true, false]);
  });
});

describe("large and mixed commits", () => {
  test("reverses many created entities with dependencies in one atomic publication", () => {
    const vault = fixture({ maxBytes: 5 * 1024 * 1024 });
    const pages = Object.fromEntries(
      Array.from({ length: 200 }, (_, i) => {
        const id = `page-${i}`;
        return [id, { ...emptyAnnotationPage, id, items: [] }];
      })
    );
    const original = vault.getState().iiif;
    vault.batch(() => {
      vault.dispatch(actions.importEntities({ entities: { AnnotationPage: pages } }));
      vault.modifyEntityField(
        ref,
        "items",
        Object.keys(pages).map((id) => ({ id, type: "AnnotationPage" }))
      );
    });
    const commits = vi.fn();
    vault.subscribeCommits(commits);
    expect(vault.undo().ok).toBe(true);
    expect(vault.getState().iiif).toStrictEqual(original);
    expect(commits).toHaveBeenCalledTimes(1);
    expect(vault.redo().ok).toBe(true);
    expect(Object.keys(vault.getState().iiif.entities.AnnotationPage)).toHaveLength(202);
  });

  test("operational values in batch imports do not break reversible document edits", () => {
    const vault = fixture();
    const state = vault.getState().iiif;
    vault.dispatch(
      actions.batchImport({
        state: {
          ...state,
          entities: {
            ...state.entities,
            Canvas: { ...state.entities.Canvas, c: { ...state.entities.Canvas.c, width: 101 } },
          },
          meta: { c: { "@vault/pagination": { error: new Error("operational") } } },
        },
      })
    );
    expect(vault.history!.getState().undo[0].commits[0].actions[0]).toEqual({
      type: actions.BATCH_IMPORT,
      payloadOmitted: true,
    });
    expect(vault.undo().ok).toBe(true);
    expect(canvas(vault).width).toBe(100);
    expect(vault.getResourceMeta("c", "@vault/pagination").error.message).toBe("operational");
    expect(vault.redo().ok).toBe(true);
  });
});
