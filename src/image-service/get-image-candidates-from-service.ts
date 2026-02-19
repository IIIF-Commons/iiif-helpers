import type { ImageService as ImageServiceV3 } from '@iiif/parser/presentation-3/types';
import type { ImageService as ImageServiceV4 } from '@iiif/parser/presentation-4/types';
import { getCustomSizeFromService } from './get-custom-size-from-service';
import { getFixedSizesFromService } from './get-fixed-sizes-from-service';
import type { ImageCandidate } from './types';

type ImageService = ImageServiceV3 | ImageServiceV4;

export function getImageCandidatesFromService(service: ImageService[]): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];

  const totalServices = service.length;
  for (let s = 0; s < totalServices; s++) {
    const single = service[s];
    if (!single) continue;
    // - x.2 embedded service - fixed sizes
    const fixedSizes = getFixedSizesFromService(single);
    if (fixedSizes.length) {
      candidates.push(...fixedSizes);
    }
    // - x.3 embedded service - profile 1 / 2 (custom size)
    const customSizes = getCustomSizeFromService(single);
    if (customSizes.length) {
      candidates.push(...customSizes);
    }
  }

  return candidates;
}
