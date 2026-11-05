import type { StateChange } from "../history/changes";
import { createAction } from "../utility/typesafe-actions-runtime";
import type { ActionType } from "typesafe-actions";

/** Exact guarded document patches, also suitable for a future canonical remote commit. */
export const APPLY_HISTORY = "@iiif/APPLY_HISTORY";
export const applyHistory = createAction(APPLY_HISTORY)<{
  changes: readonly StateChange[];
  direction: "undo" | "redo";
}>();
export type HistoryActions = ActionType<typeof applyHistory>;
