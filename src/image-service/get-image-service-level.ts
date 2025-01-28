import { level2Support, level1Support, level0Support, getImageServiceLevel as baseGetImageServiceLevel } from "@iiif/parser/image-3";
import { ImageService } from "@iiif/presentation-3";

export function getImageServiceLevel(service: ImageService): 0 | 1 | 2 | null {
  const profiles = Array.isArray(service.profile) ? service.profile : service.profile ? [service.profile] : [];
  for (const _singleProfile of profiles) {
    if (typeof _singleProfile !== 'string') continue;
    const singleProfile = (_singleProfile || '').toLowerCase();
    if (level2Support.includes(singleProfile)) {
      return 2;
    }
    if (level1Support.includes(singleProfile)) {
      return 1;
    }
    if (level0Support.includes(singleProfile)) {
      return 0;
    }
  }

  return baseGetImageServiceLevel(service) as 0 | 1 | 2 | null;
}
