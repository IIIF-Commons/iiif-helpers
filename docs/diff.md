# Manifest diffs

Import from `@iiif/helpers/diff` (also exported from the main package). This helper
works on normalized Presentation 3 data, without loading resources or mutating a
Vault. Pass a `normalize()` result, `vault.getState()`, or `vault.getState().iiif`.
Normalize remote documents independently before comparing them with the local
state. Comparing a whole Vault also includes resources unrelated to your manifest;
use a scoped normalized snapshot when reviewing just one document.

```ts
import { normalize } from "@iiif/parser";
import {
  diffNormalized,
  applyDiff,
  diffToVaultActions,
  diffToUnifiedDiff,
  createDiffSession,
  mergeNormalized,
  resolveDiffConflict,
} from "@iiif/helpers/diff";
import { batchActions } from "@iiif/helpers/vault/actions";

const before = normalize(originalManifest);
const after = normalize(remoteManifest);
const diff = diffNormalized(before, after);
const updated = applyDiff(before, diff);
const restored = applyDiff(updated, diff, { direction: "reverse" });

// Preconditions are checked against the current Vault state before actions are built.
vault.dispatch(
  batchActions({
    actions: diffToVaultActions(vault.getState(), diff),
  })
);
// Reverse actions must be built against the state AFTER the forward changes.
const undo = diffToVaultActions(vault.getState(), diff, { direction: "reverse" });
```

## Representation and comparison

`ManifestDiff` is JSON serializable and versioned (`version: 1`, `presentation: 3`).
Each resource change carries its type/ID, a property path, kind, and explicit
before/after presence and values. The change ID is deterministic for a resource
and path, suitable for selection and UI keys within a review. Missing properties
are distinct from `null`. Property paths are arrays, so URLs and property names
containing slashes need no escaping. Original resource values are retained for
contextual previews and reversibility. Mapping changes are recorded separately.
Requests and Vault metadata are not compared. Empty entity buckets are equivalent.
Inputs should contain JSON data; functions, cycles, and explicit `undefined` values
are not supported (undefined properties are treated as absent).

Resources match by normalized entity table and ID. This keeps a canvas edit
independent from a change to its position in `Manifest.items`. Objects are compared
recursively. Arrays are atomic review/conflict units: permutations are tagged
`reorder`, and membership or inline value changes are tagged `replace`. Duplicate
array values are counted. A reorder plus an edit to a referenced canvas therefore
produces independent changes. A reorder plus edits inside an inline array is one
replacement, preserving both changes without index drift.

```ts
const comparison = diffNormalized(before, after, {
  ignoreProperties: ["label"], // property names at every depth
  ignoreIds: true, // id/@id VALUES, not normalized table keys
  arrayOrder: (path, resource) => (path[0] === "items" && resource.type === "Manifest" ? "ordered" : "unordered"),
  ignore: (path, resource) => path[0].startsWith("iiif-parser:"),
});
```

Ignoring order suppresses pure permutations, preserving property/membership edits.
Ignored properties are comparison filters, not redaction: atomic replacements and
resource additions still contain original values, including ignored properties.
`ignoreIds` does not match independently renamed resources: those remain additions
and removals. Use stable resource identities when comparing separately generated
graphs. Parser bookkeeping is included by default because serialization may rely
on it; callers can exclude it for assertion-only comparisons.

## Reviewing a remote document

```ts
const review = createDiffSession(before, after);
const change = review.diff.changes[0];
review.exclude(change.id); // undo this proposed change
review.include(change.id);
review.reset(); // include all again

const state = review.getState();
const actions = review.toVaultActions();
const manifest = review.toResource({ id: originalManifest.id, type: "Manifest" });
const patch = review.toUnifiedDiff({ id: originalManifest.id, type: "Manifest" });
```

The session snapshots its inputs. It is a framework-neutral model, not a reactive
store; a Zustand/React adapter can keep selection IDs and call these methods.
`applyDiff` and `diffToVaultActions` also accept `changeIds`. Resource additions and
removals carry their mapping updates when selected. Selection does not enforce
graph dependencies: when excluding a resource addition, also exclude references
to that resource if you require a fully embedded export. Mapping-only changes have
no selectable resource change; apply the whole diff to include those updates.

Applying a diff checks each affected value against its recorded before value,
throwing `DiffPreconditionError` on stale input. Unrelated concurrent edits survive.
Reverse application checks against the recorded after value. Set
`checkPreconditions: false` only for an intentional overwrite. Vault actions use
exact `setEntity`/`setMapping` mutations rather than import's merge semantics, so
removed properties and resources really disappear. Actions install resources,
update mappings, then delete resources. Dispatch as a batch immediately after
building them: generated actions themselves do not check stale state. They do not
change Vault request status or metadata.

## Collaboration

```ts
const merged = mergeNormalized(base, local, remote);
let state = merged.state; // local values plus nonconflicting remote edits
for (const conflict of merged.conflicts) {
  state = resolveDiffConflict(state, conflict, "remote"); // or 'local'
  // A custom { exists: true, value: ... } replaces the remote change's path.
}
const resolvedChanges = diffNormalized(local, state);
```

Three-way merging automatically combines disjoint property paths and identical
edits. Overlapping paths (including deletion versus edit and competing array
changes) become explicit conflicts. Conflicting remote values are held back,
preserving local values. Each conflict contains local/remote changes and the
remote resource snapshot, allowing a remote edit to restore a locally deleted
resource. One remote change may overlap multiple local changes; group those rows
in a UI and resolve them together. Concurrent incompatible mapping changes throw
rather than silently changing resource identity. This is a snapshot merge, not
an operational-transform or CRDT protocol.

## Export

`diffToUnifiedDiff(before, diff, resource, options)` and the session's
`toUnifiedDiff` serialize the selected root with the Presentation 3 serializer and
emit a valid unified patch of the resulting JSON. The filename is derived from the
URL. Both sides use the same two-space JSON formatting. Only changed lines are
marked as additions/removals, with three unchanged context lines around each edit;
nearby edits share a hunk. Set `contextLines` to control context (including zero).
The patch works with standard diff viewers and patch tools, while the structured
diff provides resource-aware context for richer UIs. Unchanged exports return an empty string.
`serializeMergedResource(state, resource)` exports a single combined P3 resource.
The format explicitly reserves a presentation version for future P4 support; this
release implements P3 only. Text patches are export-only, not an import format.
