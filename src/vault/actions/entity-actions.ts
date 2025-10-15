import type { InternationalString, SpecificResource } from '@iiif/presentation-3';
import type { ActionType } from 'typesafe-actions';

import type { Entities } from '../types';
import { createAction } from '../utility/typesafe-actions-runtime';

export const IMPORT_ENTITIES = '@iiif/IMPORT_ENTITIES';

export const MODIFY_ENTITY_FIELD = '@iiif/MODIFY_ENTITY_FIELD';

export const REORDER_ENTITY_FIELD = '@iiif/REORDER_ENTITY_FIELD';
export const MOVE_ENTITY = '@iiif/MOVE_ENTITY';
export const MOVE_ENTITIES = '@iiif/MOVE_ENTITIES';

export const ADD_REFERENCE = '@iiif/ADD_REFERENCE';
export const UPDATE_REFERENCE = '@iiif/UPDATE_REFERENCE';
export const CHANGE_REFERENCE_IDENTIFIER = '@iiif/CHANGE_REFERENCE_IDENTIFIER';

export const REMOVE_REFERENCE = '@iiif/REMOVE_REFERENCE';

export const ADD_METADATA = '@iiif/ADD_METADATA';
export const REMOVE_METADATA = '@iiif/REMOVE_METADATA';
export const UPDATE_METADATA = '@iiif/UPDATE_METADATA';
export const REORDER_METADATA = '@iiif/REORDER_METADATA';

export const importEntities = createAction(IMPORT_ENTITIES)<{
  entities: Partial<Entities>;
}>();

export const modifyEntityField = createAction(MODIFY_ENTITY_FIELD)<{
  type: keyof Entities;
  id: string;
  key: string;
  value: any;
}>();

export const reorderEntityField = createAction(REORDER_ENTITY_FIELD)<{
  type: keyof Entities;
  id: string;
  key: string;
  startIndex: number;
  endIndex: number;
}>();

export const moveEntity = createAction(MOVE_ENTITY)<{
  subject: {
    id: string;
    type: keyof Entities;
    index?: number;
  };
  from: {
    id: string;
    type: keyof Entities;
    key: string;
  };
  to: {
    id: string;
    type: keyof Entities;
    key: string;
    index?: number;
  };
}>();

export const moveEntities = createAction(MOVE_ENTITIES)<{
  subjects:
    | {
        type: 'list';
        items: Array<{
          id: string;
          type: keyof Entities;
          index?: number;
        }>;
      }
    | {
        type: 'slice';
        startIndex: number;
        length: number;
      };
  from: {
    id: string;
    type: keyof Entities;
    key: string;
  };
  to: {
    id: string;
    type: keyof Entities;
    key: string;
    index?: number;
  };
}>();

export const addReference = createAction(ADD_REFERENCE)<{
  type: keyof Entities;
  id: string;
  key: string;
  index?: number;
  reference: SpecificResource | ({ id: string; type: string } & any);
}>();

export const removeReference = createAction(REMOVE_REFERENCE)<{
  type: keyof Entities;
  id: string;
  key: string;
  index?: number;
  reference: SpecificResource | ({ id: string; type: string } & any);
}>();

export const updateReference = createAction(UPDATE_REFERENCE)<{
  type: keyof Entities;
  id: string;
  key: string;
  index: number;
  reference: SpecificResource | ({ id: string; type: string } & any);
}>();

export const changeReferenceIdentifier = createAction(CHANGE_REFERENCE_IDENTIFIER)<{
  // Parent ID and Type to work from
  type: keyof Entities;
  id: string;
  key: string;
  index: number;
  reference: SpecificResource | ({ id: string; type: string } & any);
  newIdentifier: string;
}>();

export const addMetadata = createAction(ADD_METADATA)<{
  id: string;
  type: keyof Entities;
  beforeIndex?: number;
  label: InternationalString;
  value: InternationalString;
}>();
export const updateMetadata = createAction(UPDATE_METADATA)<{
  id: string;
  type: keyof Entities;
  atIndex?: number;
  label: InternationalString;
  value: InternationalString;
}>();
export const removeMetadata = createAction(REMOVE_METADATA)<{
  id: string;
  type: keyof Entities;
  atIndex: number;
}>();
export const reorderMetadata = createAction(REORDER_METADATA)<{
  id: string;
  type: keyof Entities;
  startIndex: number;
  endIndex: number;
}>();

export const entityActions = {
  importEntities,
  modifyEntityField,
  reorderEntityField,
  addReference,
  removeReference,
  updateReference,
  changeReferenceIdentifier,
  addMetadata,
  removeMetadata,
  updateMetadata,
  reorderMetadata,
  moveEntity,
  moveEntities,
};

export type EntityActions = ActionType<typeof entityActions>;
