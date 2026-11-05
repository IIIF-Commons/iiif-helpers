import type { AllActions, IIIFStore } from "../types";
import type { BatchAction } from "../actions/batch-actions";
import type { StateChange } from "./changes";

export type DispatchOptions = {
  actorId?: string;
  sessionId?: string;
  groupId?: string;
  label?: string;
  history?: "record" | "ignore";
  origin?: "user" | "load" | "undo" | "redo";
};
export type VaultAction = AllActions | BatchAction;

export type VaultCommit = {
  readonly id: string;
  readonly revision: number;
  readonly action: VaultAction;
  /** Flattened actions; dynamic metadata updates have been materialized. */
  readonly actions: readonly VaultAction[];
  readonly options: Readonly<DispatchOptions>;
  readonly before: IIIFStore;
  readonly after: IIIFStore;
};

export type HistoryOptions = {
  actorId?: string;
  sessionId?: string;
  maxGroups?: number;
  maxBytes?: number;
  maxAgeMs?: number;
  /** Metadata is opt-in; namespaces beginning with @vault/ are always operational. */
  metadata?: readonly string[];
};

export type LineageChange = {
  readonly path: readonly string[];
  readonly before: readonly (readonly [string, string])[];
  readonly after: readonly (readonly [string, string])[];
  readonly ancestors: readonly (readonly [string, string])[];
};

export type HistoryCommit = {
  readonly id: string;
  readonly revision: number;
  readonly actions: readonly { readonly type: string; readonly payload?: unknown; readonly payloadOmitted?: true }[];
  readonly changes: readonly StateChange[];
  readonly lineage: readonly LineageChange[];
};

export type HistoryGroup = {
  readonly id: string;
  readonly actorId: string;
  readonly sessionId: string;
  readonly label?: string;
  readonly status: "open" | "sealed" | "undone";
  readonly createdAt: number;
  readonly commits: readonly HistoryCommit[];
};

export type HistoryResult =
  | { ok: true; groupId: string }
  | {
      ok: false;
      reason: "disabled" | "empty" | "open" | "busy" | "conflict";
      path?: readonly string[];
      conflict?: "value" | "lineage" | "reference";
    };

export type HistoryState = {
  readonly undo: readonly HistoryGroup[];
  readonly redo: readonly HistoryGroup[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
};
