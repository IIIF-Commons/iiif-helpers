import { parseImageServiceRequest } from '@iiif/parser/image-3';
import { ImageService2, ImageService3 } from '@iiif/presentation-3';

//https://iiif.io/api/image/2.1/example/reference/15f769d62ca9a3a2deca390efed75d73-4_titlepage1_verso/full/512,/0/default.jpg
//https://iiif.io/api/image/2.1/example/reference/15f769d62ca9a3a2deca390efed75d73-4_titlepage1_verso/full/full/0/default.jpg
export function generateServiceFromImageUrl(input: string, size?: { width: number, height: number }): ImageService | null {
  try {
    const req = parseImageServiceRequest(input);

    // These might not even be image services.
    if (
      req.type === 'base' ||
      req.type === 'info'
    ) {
      return null;
    }

    const prefix = req.prefix.startsWith('/') ? req.prefix.substring(1) : req.prefix;
    const baseUrl = `${req.scheme}://${req.server}/${prefix ? `${prefix}/` : ''}${req.identifier}`;

    if (
      // If the ID is just the image service URL, then do nothing.
      !req.region.full ||
      // If its the full size image, we also know nothing.
      req.size.max
    ) {

      // For some reason we know that it's v3.
      if (req.size.version === 3) {
        return {
          '@context': 'http://iiif.io/api/image/3/context.json',
          id: baseUrl,
          type: 'ImageService3',
          protocol: 'http://iiif.io/api/image',
          profile: 'level0',
          width: size?.width,
          height: size?.height,
        } satisfies ImageService3;
      }
      return {
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': baseUrl,
        '@type': 'ImageService2',
        protocol: 'http://iiif.io/api/image',
        profile: 'http://iiif.io/api/image/2/level0.json', // This is as much as we know.
        width: size?.width,
        height: size?.height,
      } satisfies ImageService2;
    }

    // At this point, we've got a full image service URL. What size?
    let foundSize: { width: number; height: number } = { width: 0, height: 0 };
    if (req.size.width && req.size.height) {
      foundSize = { width: req.size.width, height: req.size.height };
    } else if (req.size.width) {
      if (size) {
        const missingHeight = Math.ceil(size.height * (req.size.width / size.width));
        foundSize = { width: req.size.width, height: missingHeight };
      }
    } else if (req.size.height) {
      if (size) {
        const missingWidth = Math.ceil(size.width * (req.size.height / size.height));
        foundSize = { width: missingWidth, height: req.size.height };
      }
    }

    if (!foundSize.width || !foundSize.height) {
      return null;
    }

    if (req.size.version === 3) {
      return {
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: baseUrl,
        type: 'ImageService3',
        protocol: 'http://iiif.io/api/image',
        profile: 'level0',
        sizes: [foundSize],
      } satisfies ImageService3;
    }

    return {
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': baseUrl,
      '@type': 'ImageService2',
      protocol: 'http://iiif.io/api/image',
      profile: 'http://iiif.io/api/image/2/level0.json', // This is as much as we know.
      sizes: [foundSize],
    } satisfies ImageService2;
  } catch (e) {
    // We don't want to throw an error here, just return null - this means it's not a valid image service URL.
    return null;
  }
}
