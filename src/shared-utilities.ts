import { isSpecificResource } from '@iiif/parser';
import type { Reference, SpecificResource } from '@iiif/presentation-3';

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

export function changeRefIdentifier(item: Reference<any> | SpecificResource, newIdentifier: string) {
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
