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
