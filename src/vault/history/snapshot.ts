import type { IIIFStore } from "../types";
import type { HistoryGroup } from "./types";
import { decodeValue, encodeValue } from "./values";

export type Checkpoint = {
  document: Omit<IIIFStore["iiif"], "requests">;
  metadata: string[];
  groups: HistoryGroup[];
  redoOrder: string[];
  heads: [string, string][];
};
function invalid(): never {
  throw new Error("Invalid Vault history snapshot");
}
const object = (value: any): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const strings = (value: any): value is string[] =>
  Array.isArray(value) && value.every((part) => typeof part === "string");
const path = (value: any): value is string[] =>
  strings(value) &&
  value[0] === "iiif" &&
  ((value[1] === "entities" && value.length >= 3 && value.length <= 5) ||
    (value[1] === "mapping" && value.length === 3) ||
    (value[1] === "meta" && value.length >= 4 && value.length <= 5));
function pairs(value: any) {
  if (!Array.isArray(value)) invalid();
  const keys = new Set<string>();
  for (const pair of value) {
    if (!strings(pair) || pair.length !== 2 || keys.has(pair[0])) invalid();
    let decoded;
    try {
      decoded = JSON.parse(pair[0]);
    } catch {
      invalid();
    }
    if (!strings(decoded) || decoded[0] !== "iiif" || JSON.stringify(decoded) !== pair[0]) invalid();
    keys.add(pair[0]);
  }
}
function value(value: any) {
  if (!object(value) || typeof value.exists !== "boolean") invalid();
  if (value.exists && JSON.stringify(encodeValue(decodeValue(value.value))) !== JSON.stringify(value.value)) invalid();
}

/** Validate everything before touching a live store. */
export function readHistorySnapshot(snapshot: unknown, metadata: readonly string[]): Checkpoint {
  try {
    if (!object(snapshot) || snapshot.format !== "@iiif/helpers/vault-history" || snapshot.version !== 1) invalid();
    const data = decodeValue(snapshot.data) as Checkpoint;
    if (JSON.stringify(encodeValue(data)) !== JSON.stringify(snapshot.data) || !object(data)) invalid();
    if (!strings(data.metadata) || JSON.stringify(data.metadata) !== JSON.stringify([...metadata].sort()))
      throw new Error("Vault history snapshot metadata policy does not match");
    const document = data.document;
    if (!object(document) || !object(document.entities) || !object(document.mapping) || !object(document.meta))
      invalid();
    if (
      !Object.values(document.entities).every((bucket) => object(bucket) && Object.values(bucket).every(object)) ||
      !Object.values(document.mapping).every((v) => typeof v === "string")
    )
      invalid();
    for (const namespaces of Object.values(document.meta)) {
      if (
        !object(namespaces) ||
        Object.keys(namespaces).some((namespace) => !metadata.includes(namespace) || namespace.startsWith("@vault/"))
      )
        invalid();
    }
    if (
      !Array.isArray(data.groups) ||
      !strings(data.redoOrder) ||
      new Set(data.redoOrder).size !== data.redoOrder.length
    )
      invalid();
    const ids = new Set<string>();
    for (const group of data.groups) {
      if (
        !object(group) ||
        typeof group.id !== "string" ||
        ids.has(group.id) ||
        typeof group.actorId !== "string" ||
        typeof group.sessionId !== "string" ||
        (group.label !== undefined && typeof group.label !== "string") ||
        !Number.isFinite(group.createdAt) ||
        !["sealed", "undone"].includes(group.status) ||
        !Array.isArray(group.commits) ||
        !group.commits.length
      )
        invalid();
      ids.add(group.id);
      for (const commit of group.commits) {
        if (
          !object(commit) ||
          typeof commit.id !== "string" ||
          !Number.isSafeInteger(commit.revision) ||
          commit.revision < 0 ||
          !Array.isArray(commit.actions) ||
          !commit.actions.every((a) => object(a) && typeof a.type === "string") ||
          !Array.isArray(commit.changes) ||
          !commit.changes.length ||
          !Array.isArray(commit.lineage) ||
          commit.changes.length !== commit.lineage.length
        )
          invalid();
        const seen = new Set<string>();
        const prefixes = new Set<string>();
        for (const [index, change] of commit.changes.entries()) {
          if (!object(change) || !path(change.path)) invalid();
          const key = JSON.stringify(change.path);
          if (prefixes.has(key) || change.path.some((_, i) => seen.has(JSON.stringify(change.path.slice(0, i + 1)))))
            invalid();
          seen.add(key);
          for (let i = 1; i <= change.path.length; i++) prefixes.add(JSON.stringify(change.path.slice(0, i)));
          if (change.path[1] === "meta" && !metadata.includes(change.path[3])) invalid();
          value(change.before);
          value(change.after);
          for (const prunes of [change.pruneBefore, change.pruneAfter]) {
            if (
              prunes !== undefined &&
              (!Array.isArray(prunes) ||
                prunes.some(
                  (p) =>
                    !strings(p) ||
                    p.length !== 3 ||
                    p[0] !== "iiif" ||
                    p[1] !== "meta" ||
                    p[2] !== change.path[2] ||
                    change.path[1] !== "meta"
                ))
            )
              invalid();
          }
          const guard = commit.lineage[index];
          if (!object(guard) || JSON.stringify(guard.path) !== key) invalid();
          pairs(guard.before);
          pairs(guard.after);
          pairs(guard.ancestors);
        }
      }
      if ((group.status === "undone") !== data.redoOrder.includes(group.id)) invalid();
    }
    if (data.redoOrder.some((id) => !ids.has(id))) invalid();
    pairs(data.heads);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === "Vault history snapshot metadata policy does not match")
      throw error;
    return invalid();
  }
}
