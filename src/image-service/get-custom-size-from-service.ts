import { getId, getImageServiceLevel, supportsCustomSizes } from "@iiif/parser/image-3";
import type { ImageService as ImageServiceV3 } from "@iiif/parser/presentation-3/types";
import type { ImageService as ImageServiceV4 } from "@iiif/parser/presentation-4/types";
import { isImage3 } from "./is-image-3";
import type { ImageCandidate } from "./types";

type ImageService = ImageServiceV3 | ImageServiceV4;

/**
 * Get custom size from service
 *
 * Given an image service – usually a full one, de-referenced or embedded – this
 * will return a list of available image sizes (min and max width and height) that
 * can be used to construct a IIIF query to get an image at any size within those
 * bounds. This is only supported by some image services. If unsupported, this will
 * return an empty list.
 *
 * @param service
 */
export function getCustomSizeFromService(service: ImageService): ImageCandidate[] {
  if (!supportsCustomSizes(service)) {
    return [];
  }

  const dimensions = service.width && service.height ? { width: service.width, height: service.height } : {};
  // API 3 uses both dimensions in canonical URLs; tile dimensions describe a
  // bounding box, not the full image's aspect ratio.
  if (isImage3(service) && (!dimensions.width || !dimensions.height)) {
    return [];
  }

  const imagesSizes: ImageCandidate[] = [];

  // Check for max width in profile.
  const profiles = Array.isArray(service.profile) ? service.profile : [service.profile];

  const pLen = profiles.length;
  for (let x = 0; x < pLen; x++) {
    const profile = profiles[x];
    if (profile && typeof profile !== "string") {
      if (profile.maxHeight || profile.maxWidth) {
        return [
          {
            id: getId(service),
            type: "variable",
            minWidth: 0,
            minHeight: 0,
            ...dimensions,
            maxHeight: (profile.maxHeight || profile.maxWidth) as number,
            maxWidth: (profile.maxWidth || profile.maxHeight) as number,
            level: getImageServiceLevel(service),
            version: isImage3(service) ? 3 : 2,
          },
        ];
      }
    }
  }

  if (service.tiles) {
    const len = service.tiles.length;
    for (let y = 0; y < len; y++) {
      const tile = service.tiles[y];
      if (tile && (tile.height || tile.width)) {
        imagesSizes.push({
          id: getId(service),
          type: "variable",
          minHeight: 0,
          minWidth: 0,
          ...dimensions,
          maxHeight: tile.height || tile.width,
          maxWidth: tile.width,
          level: getImageServiceLevel(service),
          version: isImage3(service) ? 3 : 2,
        });
      }
    }
  }

  return imagesSizes;
}
