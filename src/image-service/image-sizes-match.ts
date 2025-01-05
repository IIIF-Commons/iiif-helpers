import { ImageSize } from '@iiif/presentation-3';

export function imageSizesMatch(sizesA: ImageSize[], sizesB: ImageSize[]): boolean {
  if (sizesA.length !== sizesB.length) {
    return false;
  }

  if (sizesA.length === 0 && sizesB.length === 0) {
    return true;
  }

  const len = sizesA.length;
  let matchOrder = true;
  for (let i = 0; i < len; i++) {
    const a = sizesA[i]!;
    const b = sizesB[i]!;
    if (a.width !== b.width || a.height !== b.height) {
      matchOrder = false;
      break;
    }
  }
  if (matchOrder) {
    return true;
  }

  let matching = 0;
  for (let a = 0; a < len; a++) {
    for (let b = 0; b < len; b++) {
      if (sizesA[a]!.width === sizesB[b]!.width && sizesA[a]!.height === sizesB[b]!.height) {
        matching++;
        break;
      }
    }
  }

  return matching === len;
}
