import { ImageService } from '@iiif/presentation-3';
import { isImage3 } from './is-image-3';
import { FixedSizeImageService } from './types';
import { getId, getImageServiceLevel } from '@iiif/parser/image-3';

/**
 * Returns a fixed size image using the tile using the largest available size,
 * or the smallest scale factor.
 *
 * @param service
 */
export function getSmallestScaleFactorAsSingleImage(service: ImageService): FixedSizeImageService | null {
  if (!service.width || !service.height) {
    return null;
  }

  if (service.tiles) {
    const tiles = service.tiles.sort((a, b) => {
      return Math.max(...b.scaleFactors) - Math.max(...a.scaleFactors);
    });
    const len = tiles.length;
    for (let i = 0; i < len; i++) {
      const tile = tiles[i];
      if (!tile) continue;
      // @todo possible refinement.
      // const targetSize = tile.width > (tile.height || 0) ? tile.width : tile.height;
      const targetSize = tile.width;
      if (!targetSize) {
        continue;
      }
      const sizeLen = tile.scaleFactors.length;
      const sortedScales = tile.scaleFactors.sort();
      for (let j = 0; j < sizeLen; j++) {
        const size = sortedScales[j];
        if (!size) continue;
        if (service.width / size <= targetSize && service.height / size <= targetSize) {
          return {
            id: getId(service),
            type: 'fixed-service',
            width: (service.width / size) | 0,
            height: (service.height / size) | 0,
            level: getImageServiceLevel(service)!,
            version: isImage3(service) ? 3 : 2,
          };
        }
      }
    }
  }
  return null;
}
