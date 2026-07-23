import { normalize as normalizePresentation3 } from '@iiif/parser';
import { normalize as normalizePresentation4 } from '@iiif/parser/presentation-4';
import type { AllActions } from '../types';
import {
  addMapping,
  addMappings,
  importEntities,
  metaActions,
  requestComplete,
  requestError,
  requestMismatch,
} from '../actions';

export type ActionListFromResource = (id: string, response: unknown) => AllActions[];

function detectSourceVersion(response: unknown): 2 | 3 | 4 | 'unknown' {
  if (!response || typeof response !== 'object') {
    return 'unknown';
  }
  const resource = response as Record<string, unknown>;
  const markers = [resource['@context'], resource.profile]
    .flat(Infinity)
    .filter((value): value is string => typeof value === 'string');
  if (markers.some((value) => value.includes('/presentation/4/'))) {
    return 4;
  }
  if (markers.some((value) => value.includes('/presentation/3/'))) {
    return 3;
  }
  if (
    markers.some((value) => value.includes('/presentation/2/')) ||
    typeof resource['@id'] === 'string' ||
    typeof resource['@type'] === 'string'
  ) {
    return 2;
  }
  return 'unknown';
}

function toActionList(
  normalizeFn: (response: unknown) => {
    entities: Record<string, any>;
    resource: { id?: string; type?: string };
    mapping: any;
    diagnostics?: Array<{
      code: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      path: string;
      resourceType?: string;
      resourceId?: string;
      specRef?: string;
    }>;
    sourceVersion?: 2 | 3 | 4 | 'unknown';
  },
  id: string,
  response: unknown,
  fallbackReport?: { sourceVersion: 2 | 3 | 4 | 'unknown'; diagnostics: [] }
): AllActions[] {
  const {
    entities,
    resource,
    mapping,
    diagnostics = fallbackReport?.diagnostics,
    sourceVersion = fallbackReport?.sourceVersion,
  } = normalizeFn(response);
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
  if (sourceVersion !== undefined && diagnostics !== undefined) {
    const report = { sourceVersion, diagnostics };
    actions.push(
      metaActions.setMetaValue({
        id: resource.id,
        meta: '@vault/load',
        key: 'report',
        value: report,
      })
    );
    if (resource.id !== id) {
      actions.push(
        metaActions.setMetaValue({
          id,
          meta: '@vault/load',
          key: 'report',
          value: report,
        })
      );
    }
  }
  // Finally mark as complete.
  actions.push(requestComplete({ id }));
  // and return.
  return actions;
}

export const actionListFromResourceV3: ActionListFromResource = (id, response) =>
  toActionList(normalizePresentation3 as any, id, response, {
    sourceVersion: detectSourceVersion(response),
    diagnostics: [],
  });

export const actionListFromResourceV4: ActionListFromResource = (id, response) =>
  toActionList(normalizePresentation4 as any, id, response);

// Backward-compatible default used by the current Vault implementation.
export const actionListFromResource = actionListFromResourceV3;
