import { ContentResource, IIIFExternalWebResource } from '@iiif/presentation-3';
import { ImageServiceLoader, ImageServiceRequest } from './image-service-loader';
import { ImageCandidate } from './types';
import { getImageCandidatesFromService } from './get-image-candidates-from-service';
import { getFixedSizeFromImage } from './get-fixed-size-from-image';
import { getId, getImageServices } from '@iiif/parser/image-3';

/**
 * Get image candidates
 *
 * Given an unknown resource, and optionally an image service loader, it will
 * try to get all of the possible options for images at a specific size.
 *
 * Note: if you are wanting to depend on external web resources, then you have
 * to either preload these, or prepare the image loader for predicting them.
 *
 * @param unknownResource
 * @param dereference
 * @param loader
 */
export function getImageCandidates(
  unknownResource: ContentResource,
  dereference = true,
  loader: ImageServiceLoader
): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];
  const fixedSizeFromImage = getFixedSizeFromImage(unknownResource);
  if (fixedSizeFromImage === null) {
    return candidates;
  }
  // Cast to IIIF resource, assuming we are working in that context.
  const resource = unknownResource as IIIFExternalWebResource;

  // - x.1 fixed size
  // - x.4 ID of thumbnail (without width/height)
  candidates.push(fixedSizeFromImage);

  // We will try to dereference if available (cache or prediction).
  if (dereference && resource && resource.width && resource.height) {
    const refCandidates = [];
    const imageServices = getImageServices(resource);
    for (const service of imageServices) {
      const request: ImageServiceRequest = {
        id: getId(service),
        width: resource.width,
        height: resource.height,
      };
      if (loader.canLoadSync(request)) {
        const externalService = loader.loadServiceSync(request);
        if (externalService) {
          if (!externalService.height) {
            externalService.height = resource.height;
          }
          if (!externalService.width) {
            externalService.width = resource.width;
          }
          refCandidates.push(...getImageCandidatesFromService([externalService]));
        }
      }
    }

    if (refCandidates.length) {
      candidates.push(...refCandidates);
      return candidates;
    }
  }

  // Embedded service.
  if (resource.service) {
    candidates.push(...getImageCandidatesFromService(resource.service as any));
  }

  return candidates;
}
