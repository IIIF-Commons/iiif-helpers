export type FixedSizeImage = {
  id: string;
  type: 'fixed';
  width: number;
  height: number;
  unsafe?: boolean;
};

export type FixedSizeImageService = {
  id: string;
  type: 'fixed-service';
  width: number;
  height: number;
  level?: number | null;
  version?: number;
};

export type VariableSizeImage = {
  id: string;
  type: 'variable';
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  level?: number | null;
  version?: number;
};

export type UnknownSizeImage = {
  id: string;
  type: 'unknown';
};

export type ImageCandidate = FixedSizeImage | VariableSizeImage | UnknownSizeImage | FixedSizeImageService;

export type ImageCandidateRequest = {
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  // Configurations
  fallback?: boolean;
  atAnyCost?: boolean;
  unsafeImageService?: boolean;
  returnAllOptions?: boolean;
  allowUnsafe?: boolean;
  preferFixedSize?: boolean;
  explain?: boolean;
};

export interface ImageServiceTryOptions {
  // Exact height OR width, matches `!w,h` in the IIIF Image API specification:
  // The extracted region is scaled so that the width and height of the returned image are not greater than w and h, while maintaining the aspect ratio. The returned image must be as large as possible but not larger than the extracted region, w or h, or server-imposed limits.
  width: number;
  height: number;

  // Max width/height
  maxWidth: number;
  maxHeight: number;

  // Min width/height - will change the range of sizes.
  minWidth: number;
  minHeight: number;

  // With the min/max options, which should be prioritised.
  // "largest-size": will choose a larger image IF it's in the sizes array
  // "smallest-size": will choose a smaller image IF it's in the sizes array
  // "closest-size": will choose the closest size (area) IF it's in the sizes array
  // "largest-possible": will prefer larger images, even if not in the sizes array
  // "smallest-possible": will prefer smaller images, even if not in the sizes array
  sizePriority: 'largest-size' | 'closest-size' | 'smallest-size' | 'largest-possible' | 'smallest-possible' | 'exact';

  // Optional max area, useful if known - must be less than the maxArea specified by the loaded image service.
  maxArea: number;

  // The original width/height of the resource - useful for service that don't have width/height - this could be enough to make Image requests.
  resource: { width?: number; height?: number }

  // Optional format, quality and rotation to try.
  format: string;
  quality: string;
  rotation: number;

  // Cropped region to select - short hands available.
  region: { x: number; y: number; width: number; height: number };

  // If the image request should be made with cors, and optional headers - for auth. (async only)
  cors: boolean;
  headers: Record<string, string>;

  // Wether a virtual image should be created by requesting tiles (e.g. level0 services)
  stitch: boolean;

  // Profile - only matches if the profile matches.
  profile: 'level0' | 'level1' | 'level2';

  // Use full/full tile, if available - useful for level0 services
  fullTile: boolean;
};
