import { ImageService } from "@iiif/presentation-3";

export function getImageServiceVersion(
  service: ImageService
): 1 | 2 | 3 {
  const ctx: string[] = (service['@context']
    ? Array.isArray(service['@context'])
      ? service['@context']
      : [service['@context']]
    : []).filter(t => typeof t === 'string');

  if (ctx.find(t => t.includes('/image/1'))) {
    return 1;
  }

  if (ctx.find(t => t.includes('/image/2'))) {
    return 2;
  }

  if (ctx.find(t => t.includes('/image/3'))) {
    return 3;
  }

  throw new Error('Unknown IIIF Image Service version');
}
