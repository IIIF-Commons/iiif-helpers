import { normalize as normalizePresentation3 } from '@iiif/parser';
import { normalize as normalizePresentation4 } from '@iiif/parser/presentation-4';
import type { AllActions } from '../types';
import { addMapping, addMappings, importEntities, requestComplete, requestError, requestMismatch } from '../actions';

export type ActionListFromResource = (id: string, response: unknown) => AllActions[];

function toActionList(
  normalizeFn: (response: unknown) => {
    entities: Record<string, any>;
    resource: { id?: string; type?: string };
    mapping: any;
  },
  id: string,
  response: unknown
): AllActions[] {
  const { entities, resource, mapping } = normalizeFn(response);
  if (resource.id === undefined) {
    return [requestError({ id, message: 'ID is not defined in resource.' })] as AllActions[];
  }
  // Always import and add mappings.
  const actions: AllActions[] = [importEntities({ entities: entities as any }), addMappings({ mapping })];
  // Check if we have a resource mismatch
  if (resource.id !== id) {
    actions.push(addMapping({ id, type: resource.type as string }));
    actions.push(requestMismatch({ requestId: id, actualId: resource.id }));
  }
  // Finally mark as complete.
  actions.push(requestComplete({ id }));
  // and return.
  return actions;
}

export const actionListFromResourceV3: ActionListFromResource = (id, response) =>
  toActionList(normalizePresentation3 as any, id, response);

export const actionListFromResourceV4: ActionListFromResource = (id, response) =>
  toActionList(normalizePresentation4 as any, id, response);

// Backward-compatible default used by the current Vault implementation.
export const actionListFromResource = actionListFromResourceV3;
