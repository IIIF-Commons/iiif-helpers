import { ImageService } from '@iiif/presentation-3';
import { ImageCandidate } from './types';
import { getFixedSizesFromService } from './get-fixed-sizes-from-service';
import { getCustomSizeFromService } from './get-custom-size-from-service';

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
