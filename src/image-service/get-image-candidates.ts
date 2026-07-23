import { getId, getImageServices } from '@iiif/parser/image-3';
import type {
  ContentResource as ContentResourceV3,
  IIIFExternalWebResource as IIIFExternalWebResourceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  ContentResource as ContentResourceV4,
  ContentResourceLike as IIIFExternalWebResourceV4,
} from '@iiif/parser/presentation-4/types';
import { getFixedSizeFromImage } from './get-fixed-size-from-image';
import { getImageCandidatesFromService } from './get-image-candidates-from-service';
import type { ImageServiceLoader, ImageServiceRequest } from './image-service-loader';
import type { ImageCandidate } from './types';

type ContentResource = ContentResourceV3 | ContentResourceV4;
type IIIFExternalWebResource = IIIFExternalWebResourceV3 | IIIFExternalWebResourceV4;

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
    const imageServices = getImageServices(resource as any);
    for (const service of imageServices) {
      const request: ImageServiceRequest = {
        id: getId(service),
        width: Number(resource.width),
        height: Number(resource.height),
      };
      if (loader.canLoadSync(request)) {
        const externalService = loader.loadServiceSync(request);
        if (externalService) {
          if (!externalService.height) {
            externalService.height = Number(resource.height);
          }
          if (!externalService.width) {
            externalService.width = Number(resource.width);
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
