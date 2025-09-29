import { toRef } from '@iiif/parser';
import type { ActionType } from 'typesafe-actions';
import {
  ADD_METADATA,
  ADD_REFERENCE,
  type EntityActions,
  IMPORT_ENTITIES,
  MODIFY_ENTITY_FIELD,
  MOVE_ENTITIES,
  MOVE_ENTITY,
  moveEntity,
  REMOVE_METADATA,
  REMOVE_REFERENCE,
  REORDER_ENTITY_FIELD,
  REORDER_METADATA,
  UPDATE_METADATA,
  UPDATE_REFERENCE,
} from '../../actions';
import type { Entities } from '../../types';
import { getDefaultEntities } from '../../utility';
import { isReferenceList } from '../../utility/is-reference-list';
import { quickMerge } from '../../utility/quick-merge';

function payload<T extends { payload: any }>(action: T): T['payload'] {
  return action.payload || {};
}

function findEntity(entity: any, property: string, resource: { id: string; type: keyof Entities; index?: number }) {
  if (!entity[property] || !Array.isArray(entity[property])) {
    return null;
  }

  const index =
    typeof resource.index === 'undefined'
      ? entity[property].findIndex((item: any) => {
          if (!item) return false;
          return toRef(item)?.id === resource.id;
        })
      : resource.index;

  if (index === -1) {
    return null;
  }

  return {
    entity: entity[property][index],
    index,
  };
}

function getEntity(state: Entities, entity: { id: string; type: keyof Entities } | undefined | null) {
  if (!entity?.id || !entity?.type) {
    return;
  }
  return state[entity.type]?.[entity.id];
}

function numberOr(a: number | undefined, b: number): number {
  return typeof a === 'undefined' ? b : a;
}

export const entitiesReducer = (state: Entities = getDefaultEntities(), action: EntityActions): Entities => {
  const updateField = (entity: any, values: any) => {
    return {
      ...state,
      [(payload(action) as any).type]: {
        ...((state as any)[(payload(action) as any).type] as any),
        [(payload(action) as any).id]: {
          ...entity,
          ...values,
        },
      },
    };
  };

  switch (action.type) {
    case MODIFY_ENTITY_FIELD: {
      // Invalid.
      if (!state[payload(action).type] || !state[payload(action).type][payload(action).id]) {
        return state;
      }

      const entity = state[payload(action).type][payload(action).id];
      if (typeof entity === 'string') {
        return state;
      }

      return updateField(entity, {
        [payload(action).key]: payload(action).value,
      });
    }
    case REORDER_ENTITY_FIELD: {
      if (!isReferenceList(state, payload(action).id, payload(action).type, payload(action).key)) {
        return state;
      }

      const entity = state[payload(action).type][payload(action).id];
      if (typeof entity === 'string') {
        return state;
      }

      const result = Array.from(entity[payload(action).key]);
      const [removed] = result.splice(payload(action).startIndex, 1);
      result.splice(payload(action).endIndex, 0, removed);

      return updateField(entity, { [payload(action).key]: result });
    }
    case MOVE_ENTITIES: {
      const subjects = payload(action).subjects;
      const from = payload(action).from;
      const to = payload(action).to || from;
      const fromEntity = getEntity(state, from);
      const toKey = to?.key || from.key;

      if (!isReferenceList(state, from.id, from.type, from.key) || !isReferenceList(state, to.id, to.type, to.key)) {
        return state;
      }

      let newFromItems: any[] = [];
      let itemsToMove: any[] = [];

      if (subjects.type === 'slice') {
        // Is there a fast path here.
        const startIndex = subjects.startIndex;
        const length = subjects.length;

        newFromItems = Array.from(fromEntity[from.key]);
        itemsToMove = newFromItems.splice(startIndex, length);
      } else {
        const newFromItemsWithNulls = Array.from(fromEntity[from.key]);
        for (const subject of subjects.items) {
          const foundFrom = findEntity(fromEntity, from.key, subject);
          if (foundFrom) {
            itemsToMove.push(foundFrom.entity);
            newFromItemsWithNulls[foundFrom.index] = null;
          }
          newFromItems = newFromItemsWithNulls.filter((item) => item !== null);
        }
      }

      const fromEntityWithoutFoundItems = {
        ...fromEntity,
        [from.key]: newFromItems,
      };

      const stateWithUpdatedFrom = {
        ...state,
        [from.type]: {
          ...state[from.type],
          [from.id]: fromEntityWithoutFoundItems,
        },
      };

      const toEntity = getEntity(stateWithUpdatedFrom, to);

      if (!toEntity) {
        return state; // Hoepfully not!
      }

      const toIndex = typeof to?.index === 'undefined' ? toEntity[toKey].length : to.index;

      const newToItems = Array.from(toEntity[to.key]);
      newToItems.splice(toIndex, 0, ...itemsToMove);
      const toEntityWithItem = {
        ...toEntity,
        [toKey]: newToItems,
      };

      const withUpdatedTo = {
        ...stateWithUpdatedFrom,
        [to.type]: {
          ...stateWithUpdatedFrom[to.type],
          [to.id]: toEntityWithItem,
        },
      };

      return withUpdatedTo;
    }

    case MOVE_ENTITY: {
      return entitiesReducer(state, {
        type: MOVE_ENTITIES,
        payload: {
          subjects: { type: 'list', items: [payload(action).subject] },
          from: payload(action).from,
          to: payload(action).to,
        },
      });
    }
    case IMPORT_ENTITIES: {
      const keys = Object.keys(payload(action).entities) as Array<keyof Entities>;
      const toReturn: Entities = { ...state };

      for (const key of keys) {
        const entities = payload(action).entities[key];
        const newEntities: any = { ...(state[key] || {}) };
        let changed = false;
        const ids = (Object.keys(entities || {}) as string[]) || [];
        if (entities && ids) {
          for (const id of ids) {
            changed = true;
            newEntities[id] = state[key][id] ? quickMerge(state[key][id], entities[id]) : entities[id];
          }
          if (changed) {
            toReturn[key] = newEntities as any;
          }
        }
      }

      return toReturn;
    }

    case ADD_REFERENCE: {
      if (!isReferenceList(state, payload(action).id, payload(action).type, payload(action).key)) {
        return state;
      }

      const entity: any = state[payload(action).type][payload(action).id];
      const result = Array.from(entity[payload(action).key]);
      result.splice(numberOr(payload(action).index, result.length + 1), 0, payload(action).reference);

      return updateField(entity, { [payload(action).key]: result });
    }

    case UPDATE_REFERENCE:
    case REMOVE_REFERENCE: {
      if (!isReferenceList(state, payload(action).id, payload(action).type, payload(action).key)) {
        return state;
      }

      const entity: any = state[payload(action).type][payload(action).id];
      const result = Array.from(entity[payload(action).key]);
      const indexToRemove = numberOr(
        payload(action).index,
        result.findIndex((e: any) => e && e.id === payload(action).reference.id)
      );

      if (indexToRemove === -1 || (result as any[])[indexToRemove]?.id !== payload(action).reference.id) {
        // Nothing to remove.
        return state;
      }

      if (action.type === UPDATE_REFERENCE) {
        result.splice(indexToRemove, 1, payload(action).reference);
      } else {
        result.splice(indexToRemove, 1);
      }

      return updateField(entity, { [payload(action).key]: result });
    }

    case ADD_METADATA: {
      const entity: any = state[payload(action).type][payload(action).id];
      if (!entity) {
        return state;
      }
      const metadata = Array.from(entity.metadata || []);
      const actionPayload = payload(action);
      metadata.splice(numberOr(action.payload.beforeIndex, metadata.length + 1), 0, {
        label: actionPayload.label,
        value: actionPayload.label,
      });

      return updateField(entity, { metadata });
    }
    case REORDER_METADATA: {
      const entity: any = state[payload(action).type][payload(action).id];
      if (typeof entity === 'string' || !entity) {
        return state;
      }

      const metadata = Array.from(entity.metadata || []);
      const [removed] = metadata.splice(payload(action).startIndex, 1);
      metadata.splice(payload(action).endIndex, 0, removed);

      return updateField(entity, { metadata });
    }
    case UPDATE_METADATA:
    case REMOVE_METADATA: {
      const entity = state[payload(action).type][payload(action).id];
      const metadata = Array.from(entity.metadata || []);
      const indexToRemove = payload(action).atIndex;

      if (typeof indexToRemove === 'undefined' || indexToRemove === -1 || !(metadata as any[])[indexToRemove]) {
        // Nothing to remove.
        return state;
      }

      if (action.type === UPDATE_METADATA) {
        metadata.splice(indexToRemove, 1, {
          label: payload(action).label,
          value: payload(action).value,
        });
      } else {
        metadata.splice(indexToRemove, 1);
      }

      return updateField(entity, { metadata });
    }

    default:
      return state;
  }
};
