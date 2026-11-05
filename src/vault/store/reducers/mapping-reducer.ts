import { MappingActions, SET_MAPPING, ADD_MAPPING, ADD_MAPPINGS } from "../../actions";

export const mappingReducer = (state: Record<string, string> = {}, action: MappingActions) => {
  switch (action.type) {
    case SET_MAPPING: {
      const next = { ...state };
      if (action.payload.type === undefined) delete next[action.payload.id];
      else next[action.payload.id] = action.payload.type;
      return next;
    }
    case ADD_MAPPING:
      return {
        ...state,
        [action.payload.id]: action.payload.type,
      };

    case ADD_MAPPINGS:
      return {
        ...state,
        ...action.payload.mapping,
      };
    default:
      return state;
  }
};
