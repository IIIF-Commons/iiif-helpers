import { createAction } from "../utility/typesafe-actions-runtime";
import type { AllActions, EntityStore } from "../types";

export const BATCH_ACTIONS = "@iiif/BATCH";
export const BATCH_IMPORT = "@iiif/BATCH_IMPORT";

type BatchActionsPayload = { actions: Array<AllActions | BatchAction> };
export type BatchAction =
  | { type: typeof BATCH_ACTIONS; payload: BatchActionsPayload }
  | { type: typeof BATCH_IMPORT; payload: { state: EntityStore } };

export const batchActions = createAction(BATCH_ACTIONS)<BatchActionsPayload>();
export const batchImport = createAction(BATCH_IMPORT)<{ state: EntityStore }>();
