import type {
  ChoiceBody as ChoiceBodyV3,
  ContentResource as ContentResourceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  ChoiceResource as ChoiceBodyV4,
  ContentResource as ContentResourceV4,
} from '@iiif/parser/presentation-4/types';

type ChoiceBody = ChoiceBodyV3 | ChoiceBodyV4;
type ContentResource = ContentResourceV3 | ContentResourceV4;

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
