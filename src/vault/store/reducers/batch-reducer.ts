import { type BatchAction, BATCH_ACTIONS, BATCH_IMPORT } from "../../actions/batch-actions";
import { APPLY_HISTORY } from "../../actions/history-actions";
import { SET_META_VALUE_DYNAMIC, metaActions } from "../../actions/meta-actions";
import { applyChanges } from "../../history/changes";
import type { AllActions, IIIFStore, Reducer } from "../../types";

export function createBatchReducer(
  rootReducer: Reducer<IIIFStore, AllActions>,
  onAction?: (action: AllActions | BatchAction) => void
) {
  function reduce(state: IIIFStore, action: BatchAction | AllActions): IIIFStore {
    if (action?.type === BATCH_ACTIONS) return action.payload.actions.reduce(reduce, state);
    if (action?.type === BATCH_IMPORT) {
      onAction?.(action);
      return { ...state, iiif: { ...state.iiif, ...action.payload.state } };
    }
    if (action?.type === APPLY_HISTORY) {
      onAction?.(action);
      return applyChanges(state, action.payload.changes, action.payload.direction);
    }
    if (action?.type === SET_META_VALUE_DYNAMIC) {
      const { id, meta, key, updateValue } = action.payload;
      action = metaActions.setMetaValue({ id, meta, key, value: updateValue(state.iiif.meta[id]?.[meta]?.[key]) });
    }
    onAction?.(action);
    return rootReducer(state, action);
  }
  return reduce;
}
