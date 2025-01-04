import { Service } from '@iiif/presentation-3';
import { FixedSizeImageService } from './types';
import { getId, isImageService, getImageServiceLevel } from '@iiif/parser/image-3';
import { isImage3 } from './is-image-3';

/**
 * Get fixed sizes from service.
 *
 * Given an image service, this will extract the images from the sizes field of
 * the service. These are usually cached and great options for thumbnails.
 *
 * @param service
 */
export function getFixedSizesFromService(service: Service): FixedSizeImageService[] {
  if (!isImageService(service)) {
    return [];
  }
  return (service && service.sizes ? service.sizes : []).map((size: any) => {
    return {
      id: getId(service),
      type: 'fixed-service',
      height: size.height,
      width: size.width,
      level: getImageServiceLevel(service),
      version: isImage3(service) ? 3 : 2,
    };
  });
}
