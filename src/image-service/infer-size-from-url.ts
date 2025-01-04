import { ImageCandidate } from './types';

/**
 * Extracts the height and width from an image URL
 *
 * @param image
 */
export function inferImageSizeFromUrl(image: string): ImageCandidate {
  const regex = /^.*\/(full)\/(((\d+),(\d+)?)|max)\/(\d+)\/default\.(jpg|png|jpeg)$/;
  const match = image.match(regex);

  if (match && match[4] && match[5]) {
    const region = match[1];
    const width = parseInt(match[4], 10);
    const height = parseInt(match[5], 10);
    // const rotation = parseInt(match[6], 10);
    const format = match[7];

    if ((region === 'max' || region === 'full') && width && height && format) {
      return {
        type: 'fixed',
        id: image,
        height,
        width,
      };
    }
  }

  return { type: 'unknown', id: image };
}
