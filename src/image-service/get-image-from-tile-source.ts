import {
  canonicalServiceUrl,
  createImageServiceRequest,
  getId,
  imageServiceRequestToString,
} from '@iiif/parser/image-3';
import { FixedSizeImage, FixedSizeImageService } from './types';
import { ImageProfile } from '@iiif/presentation-3';

export function getImageFromTileSource(
  image: FixedSizeImageService,
  targetWidth: number,
  targetHeight?: number
): FixedSizeImage {
  // @todo this needs to determine levels 0, 1 + 2.
  const req = createImageServiceRequest({
    '@context':
      image.version === 3 ? 'http://iiif.io/api/image/3/context.json' : 'http://iiif.io/api/image/2/context.json',
    id: canonicalServiceUrl(getId(image)),
    profile:
      image.level === null || typeof image.level === 'undefined'
        ? ('level0' as ImageProfile)
        : (`level${image.level}` as ImageProfile),
    type: image.version === 3 ? 'ImageService3' : 'ImageService2',
  });

  if (req.type !== 'image') {
    throw new Error('Invalid service');
  }

  req.size.max = false;
  req.size.width = targetWidth;
  req.size.height = targetHeight;

  const url = imageServiceRequestToString(req);

  return {
    id: url,
    type: 'fixed',
    width: targetWidth,
    height: targetHeight || (image.height / (image.width || 1)) * targetWidth,
    unsafe: image.width > targetWidth,
  };
}
