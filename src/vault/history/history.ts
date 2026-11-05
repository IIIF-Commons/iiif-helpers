import { applyHistory } from "../actions/history-actions";
import type { VaultZustandStore } from "../store";
import type { IIIFStore } from "../types";
import { applyChanges, documentChanges, referencedIds, HistoryConflict } from "./changes";
import type {
  DispatchOptions,
  HistoryCommit,
  HistoryGroup,
  HistoryOptions,
  HistoryResult,
  HistoryState,
  LineageChange,
  VaultCommit,
  VaultHistorySnapshot,
} from "./types";
import { readHistorySnapshot } from "./snapshot";
import { decodeValue, encodeValue, freeze } from "./values";

type Group = Omit<HistoryGroup, "commits" | "status"> & {
  commits: HistoryCommit[];
  status: HistoryGroup["status"];
};

export function historyId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const pathKey = (path: readonly string[]) => JSON.stringify(path);
// Index descendants once per working copy. Large imports must not scan every
// existing head for each entity they create.
const indexes = new WeakMap<Map<string, string>, Map<string, Set<string>>>();
function prefixKeys(key: string): string[] {
  const path: string[] = JSON.parse(key);
  return path.map((_, index) => pathKey(path.slice(0, index + 1)));
}
function headIndex(heads: Map<string, string>) {
  let index = indexes.get(heads);
  if (!index) {
    index = new Map();
    for (const key of heads.keys()) {
      for (const prefix of prefixKeys(key)) {
        if (!index.has(prefix)) index.set(prefix, new Set());
        index.get(prefix)!.add(key);
      }
    }
    indexes.set(heads, index);
  }
  return index;
}
function subtree(heads: Map<string, string>, path: readonly string[]): Array<[string, string]> {
  const keys = headIndex(heads).get(pathKey(path)) || [];
  return Array.from(keys, (key): [string, string] => [key, heads.get(key)!]).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
}
function ancestors(heads: Map<string, string>, path: readonly string[]): Array<[string, string]> {
  return path.slice(0, -1).map((_, index): [string, string] => {
    const key = pathKey(path.slice(0, index + 1));
    return [key, heads.get(key) || "@baseline"];
  });
}
function restore(heads: Map<string, string>, path: readonly string[], values: readonly (readonly [string, string])[]) {
  const index = headIndex(heads);
  for (const [key] of subtree(heads, path)) {
    heads.delete(key);
    for (const prefix of prefixKeys(key)) {
      const keys = index.get(prefix)!;
      keys.delete(key);
      if (!keys.size) index.delete(prefix);
    }
  }
  for (const [key, value] of values) {
    heads.set(key, value);
    for (const prefix of prefixKeys(key)) {
      if (!index.has(prefix)) index.set(prefix, new Set());
      index.get(prefix)!.add(key);
    }
  }
}
function equal(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Local history. Actor metadata is caller supplied, not authentication or a network protocol. */
export class VaultHistory {
  readonly actorId: string;
  readonly sessionId: string;
  private readonly options: Required<HistoryOptions>;
  private groups: Group[] = [];
  private redoOrder: string[] = [];
  private openGroups = new Map<string, { createdAt: number; retained: boolean }>();
  private heads = new Map<string, string>();
  private listeners = new Set<(state: HistoryState) => void>();
  private replay?: { group: Group; direction: "undo" | "redo"; heads: Map<string, string> };
  private readonly cleanups: Array<() => void>;
  private disposed = false;
  private restoring = false;

  constructor(
    private readonly store: VaultZustandStore,
    options: HistoryOptions = {}
  ) {
    this.options = {
      actorId: options.actorId ?? historyId(),
      sessionId: options.sessionId ?? historyId(),
      maxGroups: options.maxGroups ?? 100,
      maxBytes: options.maxBytes ?? 10 * 1024 * 1024,
      maxAgeMs: options.maxAgeMs ?? Infinity,
      metadata: [...new Set(options.metadata ?? [])],
    };
    for (const limit of [this.options.maxGroups, this.options.maxBytes, this.options.maxAgeMs]) {
      if (!(limit >= 0)) throw new Error("Vault history limits must be non-negative");
    }
    if (this.options.maxGroups !== Infinity && !Number.isInteger(this.options.maxGroups)) {
      throw new Error("Vault history maxGroups must be an integer");
    }
    this.actorId = this.options.actorId;
    this.sessionId = this.options.sessionId;
    this.cleanups = [
      store.prepareCommit((commit) => this.prepare(commit)),
      store.subscribeCommits(() => this.notify()),
      store.onReset((phase) => {
        if (phase === "before") this.clear(false);
        else if (!this.restoring) this.notify();
      }),
    ];
  }

  private prepare(commit: VaultCommit): () => void {
    // Unknown reducers need explicit reversal adapters; do not silently record partial history.
    for (const key of new Set([...Object.keys(commit.before), ...Object.keys(commit.after)])) {
      if (key !== "iiif" && key !== "dispatch" && (commit.before as any)[key] !== (commit.after as any)[key]) {
        throw new Error(`Vault history cannot reverse custom state: ${key}`);
      }
    }
    if (this.replay) {
      const replay = this.replay;
      return () => {
        this.heads = replay.heads;
        replay.group.status = replay.direction === "undo" ? "undone" : "sealed";
        if (replay.direction === "undo") this.redoOrder.push(replay.group.id);
        else this.redoOrder = this.redoOrder.filter((id) => id !== replay.group.id);
        this.replay = undefined;
      };
    }
    const changes = documentChanges(commit.before, commit.after, this.options.metadata);
    const heads = new Map(this.heads);
    const lineage: LineageChange[] = changes.map(({ path }) => {
      const before = subtree(heads, path);
      const parents = ancestors(heads, path);
      restore(heads, path, [[pathKey(path), commit.id]]);
      return { path, before, after: subtree(heads, path), ancestors: parents };
    });
    const owned =
      (commit.options.actorId ?? this.actorId) === this.actorId &&
      (commit.options.sessionId ?? this.sessionId) === this.sessionId;
    const activeGroup = commit.options.groupId ? this.openGroups.get(commit.options.groupId) : undefined;
    if (owned && commit.options.groupId && !activeGroup) throw new Error("Vault history group is no longer open");
    const shouldRecord =
      owned &&
      activeGroup?.retained !== false &&
      commit.options.history !== "ignore" &&
      (commit.options.origin !== "load" || commit.options.history === "record") &&
      changes.length;
    let record: HistoryCommit | undefined;
    let group: Group | undefined;
    if (shouldRecord) {
      const id = commit.options.groupId ?? commit.id;
      group = this.groups.find((item) => item.id === id);
      if (group && group.status !== "open") throw new Error("Cannot append to a closed Vault history group");
      record = freeze({
        id: commit.id,
        revision: commit.revision,
        actions: commit.actions.map((action) => {
          try {
            return {
              type: action.type,
              ...("payload" in action ? { payload: decodeValue(encodeValue(action.payload)) } : {}),
            };
          } catch {
            // Operational data (for example an Error in imported pagination
            // metadata) must not prevent recording valid document changes.
            return { type: action.type, payloadOmitted: true as const };
          }
        }),
        changes,
        lineage,
      });
    }
    return () => {
      this.heads = heads;
      if (record) {
        // A new owned edit abandons only this actor/session's redo branch.
        this.groups = this.groups.filter((item) => item.status !== "undone");
        this.redoOrder = [];
        if (!group) {
          group = {
            id: commit.options.groupId ?? commit.id,
            actorId: this.actorId,
            sessionId: this.sessionId,
            label: commit.options.label,
            createdAt: Date.now(),
            status: "sealed",
            commits: [],
          };
          this.groups.push(group);
        }
        group.commits.push(record);
      }
      this.prune();
    };
  }

  /** Explicit groups remain open across awaits; callers must pass their ID, never an ambient flag. */
  openGroup(options: Pick<DispatchOptions, "label"> = {}): string {
    this.assertActive();
    const id = historyId();
    const createdAt = Date.now();
    this.openGroups.set(id, { createdAt, retained: true });
    this.groups.push({
      id,
      label: options.label,
      actorId: this.actorId,
      sessionId: this.sessionId,
      createdAt,
      status: "open",
      commits: [],
    });
    this.notify();
    return id;
  }

  isOpen(id: string): boolean {
    this.prune();
    return !this.disposed && this.openGroups.has(id);
  }

  closeGroup(id: string): void {
    this.openGroups.delete(id);
    const group = this.groups.find((item) => item.id === id);
    if (group?.status === "open") group.status = "sealed";
    this.groups = this.groups.filter((item) => item.status === "open" || item.commits.length);
    this.prune();
    this.notify();
  }

  private prune() {
    const cutoff = Date.now() - this.options.maxAgeMs;
    this.groups = this.groups.filter((group) => group.createdAt >= cutoff);
    for (const [id, group] of this.openGroups) if (group.createdAt < cutoff) this.openGroups.delete(id);
    const bytes = this.groups.map((group) => new TextEncoder().encode(JSON.stringify(group)).byteLength);
    let total = bytes.reduce((a, b) => a + b, 0);
    while (this.groups.length > this.options.maxGroups || total > this.options.maxBytes) {
      const removed = this.groups.shift()!;
      const active = this.openGroups.get(removed.id);
      if (active) active.retained = false;
      total -= bytes.shift()!;
    }
    this.redoOrder = this.redoOrder.filter((id) => this.groups.some((group) => group.id === id));
    // Entries with no retained guard can be dropped. Keep ancestors/descendants
    // needed by whole-entity guards, including foreign writes to a created entity.
    const paths = this.groups.flatMap((group) =>
      group.commits.flatMap((commit) => commit.changes.map((change) => change.path))
    );
    const cells = new Set(paths.map(pathKey));
    const prefixes = new Set([...cells].flatMap(prefixKeys));
    for (const key of this.heads.keys()) {
      if (!prefixes.has(key) && !prefixKeys(key).some((prefix) => cells.has(prefix))) this.heads.delete(key);
    }
    indexes.delete(this.heads);
  }

  getState(): HistoryState {
    this.prune();
    const undo = this.groups.filter((group) => group.status !== "undone" && group.commits.length);
    const redo = this.redoOrder.map((id) => this.groups.find((group) => group.id === id)!).filter(Boolean);
    const last = undo[undo.length - 1];
    return freeze({
      undo: undo.map((group) => ({ ...group, commits: [...group.commits] })),
      redo: redo.map((group) => ({ ...group, commits: [...group.commits] })),
      canUndo: !!last && last.status === "sealed" && this.canApply(last, "undo"),
      canRedo: !!redo.length && this.canApply(redo[redo.length - 1], "redo"),
    });
  }

  /** Capture a JSON-safe document and sealed history together. Finish interactions first. */
  exportSnapshot(): VaultHistorySnapshot {
    this.assertActive();
    if (this.store.isDispatching || this.openGroups.size)
      throw new Error("Cannot snapshot Vault history during an active interaction or commit");
    this.prune();
    const { entities, mapping, meta } = this.store.getState().iiif;
    const metadata = this.options.metadata.filter((namespace) => !namespace.startsWith("@vault/")).sort();
    const authoredMeta = Object.fromEntries(
      Object.entries(meta).flatMap(([id, namespaces]) => {
        const entries = Object.entries(namespaces).filter(([namespace]) => metadata.includes(namespace));
        return entries.length ? [[id, Object.fromEntries(entries)]] : [];
      })
    );
    return freeze({
      format: "@iiif/helpers/vault-history",
      version: 1,
      data: encodeValue({
        document: { entities, mapping, meta: authoredMeta },
        metadata,
        groups: this.groups,
        redoOrder: this.redoOrder,
        heads: [...this.heads],
      }),
    });
  }

  /** Restore a trusted local checkpoint, replacing the document and invalidating old scopes.
   * Groups become owned by this controller; receiver retention limits still apply.
   * Never use this to accept history from an untrusted client or restore one peer of a shared store.
   */
  restoreSnapshot(snapshot: unknown): void {
    this.assertActive();
    if (this.store.isDispatching || this.openGroups.size)
      throw new Error("Cannot restore Vault history during an active interaction or commit");
    const metadata = this.options.metadata.filter((namespace) => !namespace.startsWith("@vault/")).sort();
    const data = readHistorySnapshot(snapshot, metadata);
    const groups: Group[] = data.groups.map((group) => ({
      ...group,
      actorId: this.actorId,
      sessionId: this.sessionId,
      commits: group.commits.map((commit) => freeze(commit)),
    }));
    this.restoring = true;
    try {
      this.store.setState({ iiif: { ...data.document, requests: {} } });
      this.groups = groups;
      this.redoOrder = data.redoOrder;
      this.heads = new Map(data.heads);
      this.prune();
    } finally {
      this.restoring = false;
    }
    this.notify();
  }

  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.listeners.size) {
      const state = this.getState();
      // Snapshot so newly subscribed listeners do not join an in-progress notification.
      // oxlint-disable-next-line unicorn/no-useless-spread
      for (const listener of [...this.listeners]) listener(state);
    }
  }

  private simulate(group: Group, direction: "undo" | "redo") {
    let state: IIIFStore = this.store.getState();
    const heads = new Map(this.heads);
    const commits = direction === "undo" ? [...group.commits].reverse() : group.commits;
    const deleted = new Map<string, readonly string[]>();
    for (const commit of commits) {
      for (const guard of commit.lineage) {
        if (
          !equal(subtree(heads, guard.path), direction === "undo" ? guard.after : guard.before) ||
          !equal(ancestors(heads, guard.path), guard.ancestors)
        ) {
          throw new HistoryConflict(guard.path, "lineage");
        }
      }
      state = applyChanges(state, commit.changes, direction);
      for (const guard of commit.lineage) restore(heads, guard.path, direction === "undo" ? guard.before : guard.after);
      for (const change of commit.changes) {
        if (change.path[1] !== "entities" || (direction === "undo" ? change.before : change.after).exists) continue;
        if (change.path.length === 4) deleted.set(change.path[3], change.path);
        if (change.path.length === 3) {
          const oldBucket = direction === "undo" ? change.after : change.before;
          if (oldBucket.exists)
            for (const id of Object.keys(decodeValue(oldBucket.value))) deleted.set(id, change.path);
        }
      }
    }
    for (const [id, path] of deleted) {
      const bucket = state.iiif.entities[path[2] as keyof typeof state.iiif.entities];
      if (bucket && Object.hasOwn(bucket, id)) deleted.delete(id);
    }
    if (deleted.size) {
      const referenced = referencedIds(state, new Set(deleted.keys()), this.options.metadata);
      for (const id of referenced) throw new HistoryConflict(deleted.get(id)!, "reference");
    }
    return { state, heads, commits };
  }

  private canApply(group: Group, direction: "undo" | "redo") {
    try {
      this.simulate(group, direction);
      return true;
    } catch (error) {
      if (error instanceof HistoryConflict) return false;
      throw error;
    }
  }

  undo(): HistoryResult {
    return this.apply("undo");
  }
  redo(): HistoryResult {
    return this.apply("redo");
  }

  private apply(direction: "undo" | "redo"): HistoryResult {
    this.assertActive();
    if (this.store.isDispatching) return { ok: false, reason: "busy" };
    this.prune();
    const group =
      direction === "undo"
        ? [...this.groups].reverse().find((item) => item.status !== "undone" && item.commits.length)
        : this.groups.find((item) => item.id === this.redoOrder[this.redoOrder.length - 1]);
    if (!group) return { ok: false, reason: "empty" };
    if (group.status === "open") return { ok: false, reason: "open" };
    try {
      const result = this.simulate(group, direction);
      this.replay = { group, direction, heads: result.heads };
      // Preserve chunk order and guards; do not squash across interleaved edits.
      const actions = result.commits.map((commit) => applyHistory({ changes: commit.changes, direction }));
      this.store.dispatch(
        { type: "@iiif/BATCH", payload: { actions } },
        {
          actorId: this.actorId,
          sessionId: this.sessionId,
          groupId: group.id,
          label: group.label,
          origin: direction,
          history: "ignore",
        }
      );
      return { ok: true, groupId: group.id };
    } catch (error) {
      if (error instanceof HistoryConflict)
        return { ok: false, reason: "conflict", path: error.path, conflict: error.reason };
      throw error;
    } finally {
      this.replay = undefined;
    }
  }

  clear(notify = true): void {
    this.groups = [];
    this.openGroups.clear();
    this.redoOrder = [];
    this.heads.clear();
    if (notify) this.notify();
  }

  dispose(): void {
    this.disposed = true;
    for (const cleanup of this.cleanups) cleanup();
    this.clear();
    this.listeners.clear();
  }

  private assertActive() {
    if (this.disposed) throw new Error("Vault history has been disposed");
  }
}
