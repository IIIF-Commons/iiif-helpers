# Vault transactions and local undo/redo

History is opt-in and shared by `Vault` and `Vault4`. This implementation covers the Helpers portion of stages 1–3: the history contract and mutation inventory, batch correctness and committed-mutation observation, and local conditional undo/redo. It does not implement a network authority, authentication, persistence of history, or Manifest Editor integration.

## Basic use

```ts
import { Vault } from "@iiif/helpers/vault";

const vault = new Vault({
  history: {
    actorId: "alice",
    sessionId: "editor-tab-1",
    maxGroups: 100,
    maxBytes: 10 * 1024 * 1024,
    metadata: ["canvas-layout", "tags"],
  },
});

vault.loadManifestSync(manifest.id, manifest); // loading is not an authored edit
vault.modifyEntityField(canvas, "label", { en: ["New label"] });

const result = vault.undo();
if (!result.ok && result.reason === "conflict") {
  // Leave the document and history position unchanged; explain result.path.
}
vault.redo();

const unsubscribe = vault.history!.subscribe((state) => {
  // state.undo / state.redo contain immutable group snapshots.
  // state.canUndo / state.canRedo include conflict checks, not just stack length.
});
```

`history: true` uses generated actor/session identifiers and the default limits. History is scoped to this Vault's document state. There is no global history, and replacing state starts a new history epoch. The default age limit is unlimited; `maxAgeMs` can bound it. Disabled history returns `{ ok: false, reason: "disabled" }` from `undo()` and `redo()`.

Only this history controller's actor/session is retained on its undo stack. All document writes through dispatch still update conflict lineage, including foreign writes, ignored edits and background loads. `DispatchOptions.actorId` and `sessionId` are local attribution hints, **not authentication**. A future remote authority must assign and validate them.

## Three boundaries

- A **batch** delays reduction and atomically publishes its collected actions once. Nested batches are savepoints: a failed nested callback discards only its queued work; an uncaught outer failure discards the entire batch. Reads inside a batch see committed state, not queued writes. Explicit nested `batchActions()` and `batchImport()` are reduced recursively. Empty callback batches do not publish.
- An **interaction** groups one user's operation, including asynchronous side effects. Its commits apply immediately so later work can read them. It does not roll back already committed work on callback failure; it seals that work so the user can undo it.
- A **commit** is one successful outer reducer dispatch. `subscribeCommits()` observes it once after publication. Undoing an interaction produces one new atomic commit containing the inverse chunks; it never rewinds the whole store.

Plain dispatches are singleton sealed groups; a batch is one group unless it belongs to an interaction. The original actions are not mutated with undo metadata. Inverses come from the actual before/after reducer state, before state subscribers run. No-op changes do not occupy history.

## Scoped asynchronous work

```ts
await vault.interaction({ label: "Add image" }, async (scoped) => {
  // Pass this scoped Vault into editors, creators and side effects.
  await createImage(scoped);
  await resizeCanvasFromImage(scoped);
});
```

An explicit scope, rather than an ambient flag, carries the group ID across awaits. Calls on the original `vault` stay independent. Nested interactions invoked through the scoped Vault share the originating group. An open group cannot be undone. Groups retain their interaction-start ordering, even if their commits interleave with another interaction.

For callbacks controlled outside an async function:

```ts
const interaction = vault.beginInteraction({ label: "Resize image" });
interaction.vault.modifyEntityField(annotation, "target", nextTarget);
interaction.finish();
```

`finish()` and `cancel()` close the scope and seal applied work; neither rolls back committed state. Future calls through a closed scope fail. Clear/reset, disposal and age expiry also invalidate pending scopes. Capacity eviction discards an entire group's history and stops retaining its later chunks, but allows the operation to finish without splitting it into misleading partial undo entries.

`asyncBatch()` now isolates only calls through its callback's argument:

```ts
await vault.asyncBatch(async (scoped) => {
  scoped.modifyEntityField(canvas, "width", 800);
  await prepareSomething();
  scoped.modifyEntityField(canvas, "height", 600);
});
```

It queues these actions until successful completion. Rejection discards them. This deliberately changes the old unsafe ambient batching behaviour: references to the original Vault are **not** captured across awaits. Use `interaction()` when work must read its own committed mutations, including resource loading. Do not pass async callbacks to synchronous `batch()`.

## What is reversible

| Action family                                                                   | Reversal and coverage                                                                                                        |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `MODIFY_ENTITY_FIELD`                                                           | Exact top-level field values and property existence, including absent vs. present `undefined`                                |
| `ADD_REFERENCE`, `UPDATE_REFERENCE`, `REMOVE_REFERENCE`, `REORDER_ENTITY_FIELD` | Complete affected lists, including index-based operations and SpecificResources                                              |
| `MOVE_ENTITY`, `MOVE_ENTITIES`                                                  | Both lists from actual reducer output; same-parent moves are supported                                                       |
| `ADD_METADATA`, `UPDATE_METADATA`, `REMOVE_METADATA`, `REORDER_METADATA`        | Complete `metadata` field                                                                                                    |
| `IMPORT_ENTITIES`                                                               | Actual merge changes, not a reverse import; unrelated fields survive                                                         |
| `SET_ENTITY`                                                                    | Exact replacement/deletion; creations and deletions guard the entity subtree                                                 |
| `CHANGE_REFERENCE_IDENTIFIER`                                                   | Parent list and created/overwritten destination entity; framing is preserved                                                 |
| `ADD_MAPPING`, `ADD_MAPPINGS`, `SET_MAPPING`                                    | Exact entries, including deletion and previous absence                                                                       |
| `SET_META_VALUE`, `UNSET_META_VALUE`                                            | Only namespaces listed in `history.metadata`                                                                                 |
| `SET_META_VALUE_DYNAMIC`                                                        | Evaluated once against the correct sequential state, recorded as a concrete `SET_META_VALUE`; redo never reruns its function |
| `BATCH`, `BATCH_IMPORT`                                                         | Net document changes in one commit; nested batches reduce recursively                                                        |
| All request/loading actions                                                     | Operational; excluded from reversal                                                                                          |
| `APPLY_HISTORY`                                                                 | Exact conditional document patches, applied through the normal reducer/commit pipeline                                       |
| Custom reducer state                                                            | Changes outside `iiif` are rejected before publication when history is enabled; no silent partial reversal                   |

Document changes cover normalized entities, mappings and explicitly selected persistent metadata. All `@vault/` namespaces remain operational. Metadata namespace/container creation can produce a coarser guard than an individual value update. Existing unrelated namespaces are preserved.

Initial/background `load*()` calls default to excluded history. They still invalidate affected document guards. Loading through a scoped interaction defaults to authored work and is recorded; use `{ history: "ignore" }` on the interaction to exclude it. Request state and excluded metadata are never restored on undo. A loader can refetch an entity removed by undo; request readiness is not proof that an entity still exists.

The recorded changes use tagged, JSON-safe snapshots. They preserve absent properties, `undefined`, `null`, sparse arrays, `NaN`, infinities and negative zero. Document values must otherwise be acyclic arrays/plain objects and primitives. Unsupported changed values fail before publication. History snapshots are detached from action payloads and frozen. Diagnostic action payloads are materialized copies. Unsupported operational payloads are marked `payloadOmitted`; apply the tagged changes, not original commands, for reversal.

## Conflict contract

Entity fields (including whole arrays/language maps) are conservative conflict units. An unrelated summary edit does not prevent undoing a label edit; another write to the same label blocks it. Whole-entity creation/deletion/replacement also guards descendant writes and entity lifetime.

Guards check expected values **and logical write lineage**. Foreign or ignored changes followed by a write back to the same value still conflict. Valid undo restores prior lineage, allowing earlier local edits to be undone in sequence while the monotonically increasing commit revision continues forward.

The complete group's inverses are simulated in reverse commit order. Every chunk must validate. Only then are they reduced and published as one commit. This prevents a late side effect from absorbing an intervening write, including an intervening edit by the same actor. A blocked entry is not silently skipped. Redo applies the same guards forward and preserves generated identifiers; it does not repeat fetching or creator functions.

Before deleting entities, the engine scans the proposed final document once for surviving references to those IDs. This includes nested references, SpecificResources, string/fragment targets, parser framing and selected persistent metadata. String checks are deliberately conservative and may block an apparent textual match. This is a correctness-first dependency scan, not a maintained reference index or semantic merge engine. Version one does not transform concurrent array edits or merge individual language entries.

`undo()`/`redo()` return a discriminated result. Failures are `disabled`, `empty`, `open`, `busy` or `conflict`; conflicts include a document path and `value`, `lineage` or `reference`. Failure leaves the entire document and stack position unchanged. A new recorded local edit abandons the redo branch. Foreign edits leave it in place and may make it conflict.

## Commit observers and lifecycle

```ts
const stop = vault.subscribeCommits((commit) => {
  // id, revision, action, flattened/materialized actions, options, before, after
  // options.origin distinguishes user, load, undo and redo work.
});
```

Injected stores must come from the Helpers `createStore()` so this instrumentation is available. Use this stream rather than wrapping `dispatch()` for persistence/transports. It sees reduced outer batches exactly once, direct `getStore().dispatch()` calls, and history replay. `before`/`after` are committed immutable-by-convention store references, not deep-frozen copies; never mutate them. No-op dispatches may still produce commits, while history excludes them.

State subscribers run after history finalization. Reentrant dispatches from subscribers/commit observers are queued until all observers see the current commit, preserving commit order. Calling undo/redo while a commit is publishing returns `busy`. Commit observers should not throw. Action-type before/after events remain for compatibility; their batch states are not a sequential inverse-capture API. Derived side effects must use commit origin/group metadata to avoid generating new authored work during replay.

`getStore().setState()` clears history before replacement, restores the dispatch entry point even on a full replacement, and invalidates scoped work. A throwing state updater leaves history untouched. Arbitrary object mutation, Redux DevTools time travel, or mutation through non-Vault store internals is not supported history input. `history.clear()` drops retained groups and pending contexts; `history.dispose()` unregisters capture and observers.

Retention limits count whole groups (including redo groups), encoded record bytes and age. Evicted groups never return as partial entries. The engine also releases lineage not needed by retained guards. Records and guard state are in memory only; public snapshots are reviewable diagnostics, not a history import/restore API.

## Manifest Editor follow-up inventory

The editor is intentionally unchanged in this phase. The initial source audit identified these migration targets; this is not a claim of a completed UI interaction audit:

| Entry point                                                                  | Required integration                                                                       |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Creator.create()` / `CreatorRuntime.commit()`                               | Shared interaction for creation, mappings, parent insertion, awaited effects and placement |
| `RangeReferenceListEditor.splitRange()` and range creation followed by moves | One interaction across creation and move commits                                           |
| `AnnotationTargetEditor.setBoxStyle()` / `clearBoxStyle()`                   | Group target style class and stylesheet                                                    |
| `PartOfReferenceEditor`                                                      | Group parent reference and imported descriptive resource                                   |
| Canvas composition/layout operations                                         | Use corrected nesting; reconcile Apply/Discard snapshots with history                      |
| Text/rich-text/debounced fields                                              | Explicit edit sessions and focused native text undo routing                                |
| Dragging and timeline controls                                               | Commit once on release or use an explicit gesture group                                    |
| Translation, OCR, thumbnails and inference                                   | Define per-result vs. per-run grouping, attribution and cancellation                       |
| Exhibition bulk operations                                                   | Group at the command boundary rather than each loop iteration                              |
| RemoteClientVault and preview bridges                                        | Move dispatch monkey patches to commit observation; do not transmit queued child actions   |

Before remote use, implement authenticated ownership, authoritative revisions and conditional undo requests, request deduplication, acknowledgements, optimistic reconciliation and epoch-aware resynchronization. Local attribution and patch actions alone provide none of these guarantees.
