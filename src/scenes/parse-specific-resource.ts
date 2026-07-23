import type {
  ContentResource as ContentResourceV4,
  Selector,
  SpecificResource,
  Transform,
} from '@iiif/parser/presentation-4/types';

export type ParsedSpecificResource = {
  source: unknown;
  selector: Selector | Selector[] | null;
  transform: Transform[];
  action: unknown[];
  raw: unknown;
};

function isSpecificResourceCandidate(
  resource: unknown
): resource is Partial<SpecificResource> & { type: 'SpecificResource' } {
  return !!resource && typeof resource === 'object' && (resource as { type?: string }).type === 'SpecificResource';
}

export function parseSceneSpecificResource(resource: unknown): ParsedSpecificResource {
  if (isSpecificResourceCandidate(resource)) {
    const selector =
      Array.isArray(resource.selector) && resource.selector.length === 0 ? null : resource.selector ?? null;
    const transform = resource.transform;
    const action = resource.action;
    return {
      source: resource.source,
      selector,
      transform: Array.isArray(transform) ? transform : transform ? [transform] : [],
      action: Array.isArray(action) ? action : action ? [action] : [],
      raw: resource,
    };
  }

  // Not a SpecificResource; treat it as a direct source reference.
  return {
    source: resource as ContentResourceV4,
    selector: null,
    transform: [],
    action: [],
    raw: resource,
  };
}
