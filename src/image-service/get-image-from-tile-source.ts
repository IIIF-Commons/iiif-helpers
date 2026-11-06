import {
  canonicalServiceUrl,
  createImageServiceRequest,
  getId,
  imageServiceRequestToString,
} from "@iiif/parser/image-3";
import type { ImageProfile as ImageProfileV3 } from "@iiif/parser/presentation-3/types";
import type { ImageProfile as ImageProfileV4 } from "@iiif/parser/presentation-4/types";
import type { FixedSizeImage, FixedSizeImageService } from "./types";

type ImageProfile = ImageProfileV3 | ImageProfileV4;

export function getImageFromTileSource(
  image: FixedSizeImageService,
  targetWidth: number,
  targetHeight?: number
): FixedSizeImage {
  const req = createImageServiceRequest({
    "@context":
      image.version === 3 ? "http://iiif.io/api/image/3/context.json" : "http://iiif.io/api/image/2/context.json",
    id: canonicalServiceUrl(getId(image)),
    profile:
      image.level === null || typeof image.level === "undefined"
        ? ("level0" as ImageProfile)
        : (`level${image.level}` as ImageProfile),
    type: image.version === 3 ? "ImageService3" : "ImageService2",
  });

  if (req.type !== "image") {
    throw new Error("Invalid service");
  }

  req.size.max = false;
  // API 3 listed sizes use both dimensions, including on static level-0 servers.
  // The request serializer otherwise defaults to API 2's width-only syntax.
  req.size.version = image.version === 3 ? 3 : 2;
  req.size.width = targetWidth;
  req.size.height = targetHeight || Math.ceil((image.height / (image.width || 1)) * targetWidth);

  const url = imageServiceRequestToString(req);

  return {
    id: url,
    type: "fixed",
    width: targetWidth,
    height: req.size.height,
    unsafe: image.width > targetWidth,
  };
}
