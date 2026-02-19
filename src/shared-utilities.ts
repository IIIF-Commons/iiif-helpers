import { isSpecificResource } from '@iiif/parser';
import type {
  Reference as ReferenceV3,
  SpecificResource as SpecificResourceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  Reference as ReferenceV4,
  SpecificResource as SpecificResourceV4,
} from '@iiif/parser/presentation-4/types';

type AnyReference = ReferenceV3<any> | ReferenceV4<any>;
type AnySpecificResource = SpecificResourceV3 | SpecificResourceV4;

/**
 * A string hashing function based on Daniel J. Bernstein's popular 'times 33' hash algorithm.
 * @author MatthewBarker <mrjbarker@hotmail.com>
 */
export function hash(object: any): string {
  const text = JSON.stringify(object);

  let numHash = 5381,
    index = text.length;

  while (index) {
    numHash = (numHash * 33) ^ text.charCodeAt(--index);
  }

  const num = numHash >>> 0;

  const hexString = num.toString(16);
  if (hexString.length % 2) {
    return '0' + hexString;
  }
  return hexString;
}

export function changeRefIdentifier(item: AnyReference | AnySpecificResource, newIdentifier: string) {
  if (isSpecificResource(item)) {
    if (typeof item.source === 'string') {
      return {
        ...item,
        source: newIdentifier,
      };
    }

    return {
      ...item,
      source: {
        ...(item.source || {}),
        id: newIdentifier,
      },
    };
  }
  return {
    ...item,
    id: newIdentifier,
  };
}
