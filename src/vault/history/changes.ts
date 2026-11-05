import type { IIIFStore } from "../types";
import { decodeValue, snapshot, snapshotsEqual, type ValueSnapshot } from "./values";

export type StateChange = {
  readonly path: readonly string[];
  readonly before: ValueSnapshot;
  readonly after: ValueSnapshot;
  readonly pruneBefore?: readonly (readonly string[])[];
  readonly pruneAfter?: readonly (readonly string[])[];
};

/** Only document data: request state is operational and never reversed. */
export function documentChanges(before: IIIFStore, after: IIIFStore, metadata: readonly string[] = []): StateChange[] {
  const changes: StateChange[] = [];
  function walk(left: any, right: any, path: string[], depth: number) {
    if (left === right) return;
    for (const key of new Set([...Object.keys(left || {}), ...Object.keys(right || {})])) {
      if (left?.[key] === right?.[key] && Object.hasOwn(left || {}, key) === Object.hasOwn(right || {}, key)) continue;
      if (
        depth > 0 &&
        Object.hasOwn(left || {}, key) &&
        Object.hasOwn(right || {}, key) &&
        isObject(left[key]) &&
        isObject(right[key])
      ) {
        walk(left[key], right[key], [...path, key], depth - 1);
      } else {
        const from = snapshot(left, key);
        const to = snapshot(right, key);
        if (!snapshotsEqual(from, to)) changes.push({ path: [...path, key], before: from, after: to });
      }
    }
  }
  walk(before.iiif.entities, after.iiif.entities, ["iiif", "entities"], 2);
  walk(before.iiif.mapping, after.iiif.mapping, ["iiif", "mapping"], 0);
  for (const id of new Set([...Object.keys(before.iiif.meta), ...Object.keys(after.iiif.meta)])) {
    for (const namespace of metadata) {
      if (namespace.startsWith("@vault/")) continue;
      const left = before.iiif.meta[id];
      const right = after.iiif.meta[id];
      const start = changes.length;
      walk(
        left && Object.hasOwn(left, namespace) ? { [namespace]: left[namespace] } : {},
        right && Object.hasOwn(right, namespace) ? { [namespace]: right[namespace] } : {},
        ["iiif", "meta", id],
        1
      );
      for (let i = start; i < changes.length; i++) {
        changes[i] = {
          ...changes[i],
          ...(!Object.hasOwn(before.iiif.meta, id) ? { pruneBefore: [["iiif", "meta", id]] } : {}),
          ...(!Object.hasOwn(after.iiif.meta, id) ? { pruneAfter: [["iiif", "meta", id]] } : {}),
        };
      }
    }
  }
  return changes;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function valueAt(state: IIIFStore, path: readonly string[]): ValueSnapshot {
  let parent: any = state;
  for (const key of path.slice(0, -1)) {
    if (!parent || !Object.hasOwn(parent, key)) return { exists: false };
    parent = parent[key];
  }
  return snapshot(parent, path[path.length - 1]);
}

export class HistoryConflict extends Error {
  constructor(
    readonly path: readonly string[],
    readonly reason: "value" | "lineage" | "reference"
  ) {
    super(`Vault history conflict (${reason}) at ${path.join("/")}`);
  }
}

/** Validate and apply to temporary state; a failure never publishes partial changes. */
export function applyChanges(state: IIIFStore, changes: readonly StateChange[], direction: "undo" | "redo"): IIIFStore {
  const seen = new Set<string>();
  const prefixes = new Set<string>();
  for (const change of changes) {
    const path = change.path;
    const valid =
      path[0] === "iiif" &&
      ((path[1] === "entities" && path.length >= 3 && path.length <= 5) ||
        (path[1] === "mapping" && path.length === 3) ||
        (path[1] === "meta" && path.length >= 4 && path.length <= 5));
    if (!valid || !path.every((segment) => typeof segment === "string"))
      throw new Error("Invalid Vault document patch path");
    for (const parent of [...(change.pruneBefore || []), ...(change.pruneAfter || [])]) {
      if (
        path[1] !== "meta" ||
        parent.length !== 3 ||
        parent[0] !== "iiif" ||
        parent[1] !== "meta" ||
        parent[2] !== path[2]
      ) {
        throw new Error("Invalid Vault document patch parent");
      }
    }
    const key = JSON.stringify(path);
    if (prefixes.has(key) || path.some((_, index) => seen.has(JSON.stringify(path.slice(0, index + 1))))) {
      throw new Error("Overlapping Vault document patches");
    }
    seen.add(key);
    for (let i = 1; i <= path.length; i++) prefixes.add(JSON.stringify(path.slice(0, i)));
    const expected = direction === "undo" ? change.after : change.before;
    if (!snapshotsEqual(valueAt(state, change.path), expected)) throw new HistoryConflict(change.path, "value");
  }
  if (!changes.length) return state;
  // Copy each touched container once, rather than cloning a large entity bucket
  // for every entity in an import/reversal.
  const next = { ...state };
  const drafts = new Map<string, any>([["[]", next]]);
  function write(path: readonly string[], value: ValueSnapshot) {
    let parent: any = next;
    for (let i = 0; i < path.length - 1; i++) {
      const key = JSON.stringify(path.slice(0, i + 1));
      if (!drafts.has(key)) {
        const child = { ...(Object.hasOwn(parent, path[i]) ? parent[path[i]] : undefined) };
        Object.defineProperty(parent, path[i], { value: child, enumerable: true, configurable: true, writable: true });
        drafts.set(key, child);
      }
      parent = drafts.get(key);
    }
    const key = path[path.length - 1];
    if (value.exists)
      Object.defineProperty(parent, key, {
        value: decodeValue(value.value),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    else delete parent[key];
  }
  for (const change of changes) write(change.path, direction === "undo" ? change.before : change.after);
  for (const change of changes) {
    for (const path of (direction === "undo" ? change.pruneBefore : change.pruneAfter) || []) {
      const existing = valueAt(next, path);
      if (existing.exists && existing.value[0] === "object" && !existing.value[1].length) {
        write(path, { exists: false });
      }
    }
  }
  return next;
}

/** Scan once for all entities that a reversal would delete. String checks are deliberately conservative. */
export function referencedIds(
  state: IIIFStore,
  ids: ReadonlySet<string>,
  metadata: readonly string[] = []
): Set<string> {
  const found = new Set<string>();
  const seen = new Set<object>();
  function visit(value: any) {
    if (typeof value === "string") {
      if (ids.has(value)) found.add(value);
      const fragment = value.indexOf("#");
      if (fragment !== -1 && ids.has(value.slice(0, fragment))) found.add(value.slice(0, fragment));
    } else if (value && typeof value === "object" && !seen.has(value)) {
      seen.add(value);
      for (const child of Object.values(value)) visit(child);
    }
  }
  for (const bucket of Object.values(state.iiif.entities)) {
    for (const entity of Object.values(bucket)) {
      if (!entity || typeof entity !== "object") continue;
      for (const [key, value] of Object.entries(entity)) {
        if (key !== "id" && key !== "@id") visit(value);
      }
    }
  }
  for (const values of Object.values(state.iiif.meta)) {
    for (const namespace of metadata) if (!namespace.startsWith("@vault/")) visit(values[namespace]);
  }
  return found;
}
