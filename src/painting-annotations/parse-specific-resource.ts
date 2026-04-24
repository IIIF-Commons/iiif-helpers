import { ChoiceBody, ContentResource } from '@iiif/presentation-3';

export function parseSpecificResource(
  resource: ContentResource
): [ContentResource | ChoiceBody, { selector?: any; styleClass?: string }] {
  if (resource.type === 'SpecificResource') {
    return [
      resource.source,
      {
        selector: resource.selector,
        ...((resource as any).styleClass ? { styleClass: (resource as any).styleClass } : {}),
      },
    ];
  }

  return [resource, { selector: null }];
}
