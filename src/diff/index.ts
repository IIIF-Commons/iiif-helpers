import { createTwoFilesPatch } from "diff";
import { serialize, serializeConfigPresentation3 } from "@iiif/parser";
import { setEntity, setMapping } from "../vault/actions";
import type { AllActions, Entities } from "../vault/types";

/** Structural input accepted from normalize(), vault.getState(), or vault.getState().iiif. */
export interface DiffState {
  entities: Record<string, Record<string, any>>;
  mapping: Record<string, string>;
}
export type DiffInput = DiffState | { iiif: DiffState };
export interface ResourceIdentity {
  type: string;
  id: string;
}
export interface DiffOptions {
  /** Ignore property names at any depth (including parser bookkeeping if desired). */
  ignoreProperties?: string[];
  /** Ignore ID property values; entity matching still uses type and ID. */
  ignoreIds?: boolean;
  arrayOrder?: "ordered" | "unordered" | ((path: string[], resource: ResourceIdentity) => "ordered" | "unordered");
  ignore?: (path: string[], resource: ResourceIdentity) => boolean;
}
/** Presence is explicit so deletion survives JSON serialization. Inputs must be JSON data. */
export type DiffValue = { exists: false } | { exists: true; value: any };
export interface ResourceChange {
  id: string;
  resource: ResourceIdentity;
  path: string[];
  kind: "add" | "remove" | "replace" | "reorder";
  before: DiffValue;
  after: DiffValue;
}
export interface MappingChange {
  id: string;
  before: DiffValue;
  after: DiffValue;
}
export interface ManifestDiff {
  version: 1;
  presentation: 3;
  changes: ResourceChange[];
  mappings: MappingChange[];
}
export interface ApplyDiffOptions {
  direction?: "forward" | "reverse";
  /** Selected change IDs. Mapping updates follow resource additions/removals. */
  changeIds?: string[];
  /** Reject stale edits rather than overwriting concurrent changes (default true). */
  checkPreconditions?: boolean;
}
export interface UnifiedDiffOptions extends ApplyDiffOptions {
  /** Unchanged lines around each edit (default 3). Nearby edits share a hunk. */
  contextLines?: number;
}
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value: any): value is Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));
const slot = (value: any, key: string): DiffValue =>
  own(value, key) && value[key] !== undefined ? { exists: true, value: clone(value[key]) } : { exists: false };
const unwrap = (input: DiffInput): DiffState => ("iiif" in input ? input.iiif : input);

function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (object(value))
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function equal(a: any, b: any): boolean {
  return canonical(a) === canonical(b);
}
function keys(a: object, b: object): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
}
function ignored(key: string, path: string[], resource: ResourceIdentity, options: DiffOptions) {
  return (
    (options.ignoreIds && (key === "id" || key === "@id")) ||
    options.ignoreProperties?.includes(key) ||
    options.ignore?.(path, resource)
  );
}
function project(value: any, path: string[], resource: ResourceIdentity, options: DiffOptions): any {
  if (Array.isArray(value)) return value.map((v, i) => project(v, [...path, String(i)], resource, options));
  if (!object(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((k) => !ignored(k, [...path, k], resource, options))
      .map((k) => [k, project(value[k], [...path, k], resource, options)])
  );
}

/** Diff normalized P3 entities. Requests/meta and empty entity buckets are not document changes. */
export function diffNormalized(before: DiffInput, after: DiffInput, options: DiffOptions = {}): ManifestDiff {
  const a = unwrap(before),
    b = unwrap(after);
  const result: ManifestDiff = { version: 1, presentation: 3, changes: [], mappings: [] };
  const emit = (
    resource: ResourceIdentity,
    path: string[],
    old: DiffValue,
    next: DiffValue,
    kind?: ResourceChange["kind"]
  ) => {
    result.changes.push({
      id: JSON.stringify([resource.type, resource.id, ...path]),
      resource,
      path,
      kind: kind || (!old.exists ? "add" : !next.exists ? "remove" : "replace"),
      before: old,
      after: next,
    });
  };
  const walk = (resource: ResourceIdentity, path: string[], old: DiffValue, next: DiffValue) => {
    if (equal(old, next)) return;
    if (old.exists && next.exists && object(old.value) && object(next.value)) {
      for (const key of keys(old.value, next.value)) {
        const child = [...path, key];
        if (!ignored(key, child, resource, options)) walk(resource, child, slot(old.value, key), slot(next.value, key));
      }
      return;
    }
    if (old.exists && next.exists && Array.isArray(old.value) && Array.isArray(next.value)) {
      const left = project(old.value, path, resource, options),
        right = project(next.value, path, resource, options);
      if (equal(left, right)) return;
      const permutation = equal(left.map(canonical).sort(), right.map(canonical).sort());
      const order = typeof options.arrayOrder === "function" ? options.arrayOrder(path, resource) : options.arrayOrder;
      if (permutation && order === "unordered") return;
      emit(resource, path, old, next, permutation ? "reorder" : "replace");
      return;
    }
    emit(resource, path, old, next);
  };
  for (const type of keys(a.entities, b.entities)) {
    const left = a.entities[type] || {},
      right = b.entities[type] || {};
    for (const id of keys(left, right)) walk({ type, id }, [], slot(left, id), slot(right, id));
  }
  for (const id of keys(a.mapping, b.mapping)) {
    const old = slot(a.mapping, id),
      next = slot(b.mapping, id);
    if (!equal(old, next)) result.mappings.push({ id, before: old, after: next });
  }
  return result;
}

function read(state: DiffState, change: ResourceChange): DiffValue {
  let value = slot(state.entities[change.resource.type] || {}, change.resource.id);
  for (const key of change.path) {
    if (!value.exists || !object(value.value)) return { exists: false };
    value = slot(value.value, key);
  }
  return value;
}
function write(state: DiffState, change: ResourceChange, value: DiffValue) {
  const { type, id } = change.resource;
  const bucket = (state.entities[type] ||= {});
  let parent = bucket,
    key = id;
  for (const child of change.path) {
    if (!object(parent[key])) throw new Error(`Missing parent for change ${change.id}`);
    parent = parent[key];
    key = child;
  }
  if (value.exists)
    Object.defineProperty(parent, key, {
      value: clone(value.value),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  else delete parent[key];
}
export class DiffPreconditionError extends Error {
  constructor(public changeId: string) {
    super(`Diff precondition failed: ${changeId}`);
    this.name = "DiffPreconditionError";
  }
}
function selected(diff: ManifestDiff, options: ApplyDiffOptions): ResourceChange[] {
  const ids = options.changeIds && new Set(options.changeIds);
  if (ids) for (const id of ids) if (!diff.changes.some((c) => c.id === id)) throw new Error(`Unknown change: ${id}`);
  const changes = diff.changes.filter((c) => !ids || ids.has(c.id));
  return options.direction === "reverse" ? [...changes].reverse() : changes;
}
/** Immutable, selective, reversible application. No partial result is returned on a stale edit. */
export function applyDiff(input: DiffInput, diff: ManifestDiff, options: ApplyDiffOptions = {}): DiffState {
  if (diff.version !== 1 || diff.presentation !== 3) throw new Error("Unsupported diff format");
  const state = clone(unwrap(input));
  const reverse = options.direction === "reverse";
  const changes = selected(diff, options);
  for (const change of changes) {
    const expected = reverse ? change.after : change.before;
    if (options.checkPreconditions !== false && !equal(read(state, change), expected))
      throw new DiffPreconditionError(change.id);
    write(state, change, reverse ? change.before : change.after);
  }
  for (const change of diff.mappings) {
    if (options.changeIds && !changes.some((c) => c.resource.id === change.id && c.path.length === 0)) continue;
    const expected = reverse ? change.after : change.before,
      value = reverse ? change.before : change.after;
    if (options.checkPreconditions !== false && !equal(slot(state.mapping, change.id), expected))
      throw new DiffPreconditionError(`mapping:${change.id}`);
    if (value.exists)
      Object.defineProperty(state.mapping, change.id, {
        value: value.value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    else delete state.mapping[change.id];
  }
  return state;
}

/** Ordered exact Vault actions: install resources, update mappings, then remove resources. */
export function diffToVaultActions(input: DiffInput, diff: ManifestDiff, options: ApplyDiffOptions = {}): AllActions[] {
  const before = unwrap(input),
    after = applyDiff(input, diff, options);
  const actions: AllActions[] = [],
    removals: AllActions[] = [];
  for (const type of keys(before.entities, after.entities))
    for (const id of keys(before.entities[type] || {}, after.entities[type] || {})) {
      const old = slot(before.entities[type] || {}, id),
        next = slot(after.entities[type] || {}, id);
      if (!equal(old, next))
        (next.exists ? actions : removals).push(
          setEntity({ type: type as keyof Entities, id, entity: next.exists ? next.value : undefined })
        );
    }
  for (const id of keys(before.mapping, after.mapping))
    if (before.mapping[id] !== after.mapping[id]) actions.push(setMapping({ id, type: after.mapping[id] }));
  return [...actions, ...removals];
}

export interface DiffConflict {
  id: string;
  local: ResourceChange;
  remote: ResourceChange;
  /** Remote resource snapshot for resolving edit-versus-delete conflicts. */
  remoteResource: DiffValue;
  remoteMapping: DiffValue;
}
export interface MergeResult {
  state: DiffState;
  conflicts: DiffConflict[];
  diff: ManifestDiff;
}
const overlaps = (a: ResourceChange, b: ResourceChange) =>
  a.resource.type === b.resource.type &&
  a.resource.id === b.resource.id &&
  a.path.slice(0, Math.min(a.path.length, b.path.length)).every((v, i) => v === b.path[i]);
/** Three-way merge. Conflicting remote changes are held back; local values remain. Arrays are atomic. */
export function mergeNormalized(
  base: DiffInput,
  local: DiffInput,
  remote: DiffInput,
  options: DiffOptions = {}
): MergeResult {
  const left = diffNormalized(base, local, options),
    right = diffNormalized(base, remote, options);
  const conflicts: DiffConflict[] = [],
    accepted: ResourceChange[] = [];
  for (const change of right.changes) {
    const matches = left.changes.filter((c) => overlaps(c, change));
    if (matches.some((c) => equal(c.path, change.path) && equal(c.after, change.after))) continue;
    if (matches.length)
      for (const match of matches)
        conflicts.push({
          id: JSON.stringify([match.id, change.id]),
          local: match,
          remote: change,
          remoteResource: slot(unwrap(remote).entities[change.resource.type] || {}, change.resource.id),
          remoteMapping: slot(unwrap(remote).mapping, change.resource.id),
        });
    else accepted.push(change);
  }
  // Mapping collisions are rejected rather than silently overwriting local identity changes.
  const mappings = right.mappings.filter((c) => {
    const other = left.mappings.find((l) => l.id === c.id);
    if (other && !equal(other.after, c.after)) throw new DiffPreconditionError(`mapping:${c.id}`);
    return !other && !conflicts.some((f) => f.remote.resource.id === c.id);
  });
  const state = applyDiff(local, { ...right, changes: accepted, mappings });
  return { state, conflicts, diff: diffNormalized(local, state, options) };
}

/** Resolve a reported conflict explicitly, or supply a replacement value for its remote path.
 * Use the returned state as the input to subsequent resolutions. */
export function resolveDiffConflict(
  state: DiffInput,
  conflict: DiffConflict,
  resolution: "local" | "remote" | DiffValue
): DiffState {
  if (resolution === "local") return clone(unwrap(state));
  const result = clone(unwrap(state));
  // If local removed an ancestor, restore the corresponding remote subtree first.
  if (conflict.local.path.length < conflict.remote.path.length) {
    let value = conflict.remoteResource;
    for (const key of conflict.local.path)
      value = value.exists && object(value.value) ? slot(value.value, key) : { exists: false };
    write(result, conflict.local, value);
  }
  const change = { ...conflict.remote, after: resolution === "remote" ? conflict.remote.after : resolution };
  write(result, change, change.after);
  if (!result.entities[change.resource.type]?.[change.resource.id]) delete result.mapping[change.resource.id];
  else if (conflict.remoteMapping.exists) result.mapping[change.resource.id] = conflict.remoteMapping.value;
  return result;
}

/** Framework-neutral review model; subscribe from a UI store if needed. */
export function createDiffSession(before: DiffInput, after: DiffInput, options: DiffOptions = {}) {
  const base = clone(unwrap(before));
  const diff = diffNormalized(base, after, options);
  const included = new Set(diff.changes.map((c) => c.id));
  const applyOptions = (): ApplyDiffOptions => ({ changeIds: [...included] });
  return {
    diff,
    include(id: string) {
      if (!diff.changes.some((c) => c.id === id)) throw new Error(`Unknown change: ${id}`);
      included.add(id);
    },
    exclude(id: string) {
      included.delete(id);
    },
    reset() {
      included.clear();
      for (const c of diff.changes) included.add(c.id);
    },
    getState: () => applyDiff(base, diff, applyOptions()),
    getChangeIds: () => [...included],
    toVaultActions: () => diffToVaultActions(base, diff, applyOptions()),
    toResource: (resource: ResourceIdentity) =>
      serializeMergedResource(applyDiff(base, diff, applyOptions()), resource),
    toUnifiedDiff: (resource: ResourceIdentity, options: Pick<UnifiedDiffOptions, "contextLines"> = {}) =>
      diffToUnifiedDiff(base, diff, resource, { ...applyOptions(), ...options }),
  };
}

export function serializeMergedResource(state: DiffInput, resource: ResourceIdentity): unknown {
  return serialize({ requests: {}, meta: {}, ...unwrap(state) } as any, resource as any, serializeConfigPresentation3);
}
/** Contextual unified patch of consistently pretty-printed P3 JSON. */
export function diffToUnifiedDiff(
  input: DiffInput,
  diff: ManifestDiff,
  resource: ResourceIdentity,
  options: UnifiedDiffOptions = {}
): string {
  const context = options.contextLines ?? 3;
  if (!Number.isSafeInteger(context) || context < 0) throw new Error("contextLines must be a non-negative integer");
  const after = applyDiff(input, diff, options);
  const text = (state: DiffState) => {
    if (!state.entities[resource.type]?.[resource.id]) return "";
    return `${JSON.stringify(serializeMergedResource(state, resource), null, 2)}\n`;
  };
  const a = text(unwrap(input)),
    b = text(after);
  if (a === b) return "";
  const name = encodeURIComponent(resource.id);
  return createTwoFilesPatch(
    a ? `a/${name}.json` : "/dev/null",
    b ? `b/${name}.json` : "/dev/null",
    a,
    b,
    undefined,
    undefined,
    { context }
  ).replace(/^=+\n/, "");
}
