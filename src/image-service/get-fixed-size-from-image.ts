import { ContentResource, IIIFExternalWebResource } from '@iiif/presentation-3';
import { ImageCandidate } from './types';
import { inferImageSizeFromUrl } from './infer-size-from-url';
import { getId, getType } from '@iiif/parser/image-3';

/**
 * Get fixed size from image
 *
 * Given a content resource, usually the body of a painting annotation, this will
 * return the URL to the image, and the height and width. The resource may also
 * be a string / direct link to the image. The height and width may be inferred from
 * a IIIF Image API endpoint, otherwise the return image candidate will have a type
 * of unknown.
 *
 * @param contentResource
 */
export function getFixedSizeFromImage(contentResource: ContentResource | string): ImageCandidate | null {
  if (typeof contentResource === 'string') {
    // Might not even be an image.
    return inferImageSizeFromUrl(contentResource);
  }

  const type = getType(contentResource);
  if (type !== 'Image' && type !== 'sc:Image') {
    return null;
  }

  const image = contentResource as IIIFExternalWebResource;
  const id = getId(image);

  if (!id) {
    return null;
  }

  if (id && image.width && image.height) {
    return {
      id: id,
      type: 'fixed',
      width: image.width,
      height: image.height,
      unsafe: true,
    };
  }

  return inferImageSizeFromUrl(id);
}
