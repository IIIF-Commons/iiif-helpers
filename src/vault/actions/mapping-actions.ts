import { ActionType } from "typesafe-actions";
import { createAction } from "../utility/typesafe-actions-runtime";

export const SET_MAPPING = "@iiif/SET_MAPPING";
export const setMapping = createAction(SET_MAPPING)<{ id: string; type: string | undefined }>();

export const ADD_MAPPING = "@iiif/ADD_MAPPING";
export const ADD_MAPPINGS = "@iiif/ADD_MAPPINGS";

export const addMapping = createAction(ADD_MAPPING)<{ id: string; type: string }>();
export const addMappings = createAction(ADD_MAPPINGS)<{ mapping: { [id: string]: string } }>();

export const mappingActions = { setMapping, addMapping, addMappings };

export type MappingActions = ActionType<typeof mappingActions>;
