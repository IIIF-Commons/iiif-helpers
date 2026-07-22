// Image service helper.
import { ImageService, ImageSize, ImageTile } from "@iiif/presentation-3";
import { ImageServiceLoader } from "./image-service-loader";
import { imageServiceLoader } from "../thumbnail";
import { SizeParameter, RegionParameter, RotationParameter, canonicalServiceUrl, supports, imageServiceRequestToString, parseImageServiceUrl } from '@iiif/parser/image-3';
import { Emitter } from "mitt";
import { StoreApi, createStore } from "zustand/vanilla";
import { getImageServiceVersion } from "./get-image-service-version";
import { ImageServiceStore } from "./image-service-store";
import { getImageServiceLevel } from "./get-image-service-level";

export function imageService(id: string | ImageService) {
  return new ImageServiceTryBuilder(
    typeof id === "string" ? { id } as any : id
  );
}

interface TryConstraints {
  profile: null | 'level0' | 'level1' | 'level2';

  width: number;
  height: number;

  maxArea: number;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  minArea: number;

  quality: string;
  region: RegionParameter;
  rotation: RotationParameter;
  format: string;
}

interface TryOptions {
  // Other options?
  unsafe: boolean;
  sizePriority: 'largest-size' | 'closest-size' | 'smallest-size' | 'largest-possible' | 'smallest-possible' | 'exact';
  cors: boolean;
  headers: Record<string, string>;
  stitch: boolean; // @todo future feature.
  rounding: 'ceil' | 'floor' | 'round';
  placeholder: string | null;
}

interface AsyncTryOptions {
  loadService: boolean;
  verifyImage: boolean;
}


interface ImageServiceTryStore {
  imageServiceInfoJson: string;
  originalService: ImageService | null;
  fullService: ImageService | null;
  imageServer: ReturnType<typeof parseImageServiceUrl>;

  sizes: ImageSize[];
  tiles: ImageTile[];

  // Loading state.
  isLoading: boolean;
  didError: boolean;
  error: string | null;
  isFullyLoaded: boolean;

  level: null | 0 | 1 | 2;
  version: null | 1 | 2 | 3;
  maxArea: number;
  maxWidth: number;
  maxHeight: number;
  tileSizes: number[];
  formats: string[];
  qualities: string[];
  fullTiles: Array<{
    scale: number;
    width: number;
    height: number;
  }>;

  // Constraints are requested by the user application. These will usually
  // get looser until the image is loaded. We will go through the try queue
  // until we find an image that fits the constraints.
  constraints: TryConstraints;
  options: TryOptions;

  features: {
    cors: boolean; // level 1+
    corsVerified: boolean; // our own check
    sizeByWh: boolean; // level 1+
    sizeByW: boolean; // level 1+
    sizeByH: boolean; // level 1+
    sizeByWhListed: boolean; // deprecated, but set with the existence of `.sizes`
  };

  tryCursor: number;
  tryQueue: Array<{
    id: string | null;
    isAsync: boolean;
    isFetching: boolean;
    isVerifying: boolean;
    isVerified: boolean;
    isError: boolean;
    error: string | null;
    constraints: Partial<TryConstraints>;
  }>;

  fallback: string | null;
  defaultImage: string | null;
}

interface ImageServiceTryStoreMethods {
  ingestImageService(imageService: ImageService, isFullyLoaded: boolean): void;
  requestImageService(): Promise<void>;
  generateImageUrlAtSize(opts: Partial<SizeParameter>): string;

  sizeByWh(width: number, height: number): string;
  sizeByW(width: number): string;
  sizeByH(height: number): string;
  sizeByWhListed(size: ImageSize): string;

  // Getters that trigger the queue.
  image(): string | null;
  asyncImage(): Promise<string | null>;
  test(): Promise<void>;

  // Try requests.
  try(tryRequest: Partial<TryConstraints & TryOptions>, asyncOptions?: Partial<AsyncTryOptions>): void;
  asyncTry(tryRequest: Partial<TryConstraints & TryOptions & AsyncTryOptions>): Promise<string | null>;

  // Constraints that are shared by all other requests.
  constrain(constraints: Partial<TryConstraints>): void;
}

type ImageServiceTryStoreEvents = {
  'fully-loaded': { imageService: ImageService };
};

function imageServiceToState(imageService: ImageService, isFullyLoaded = false): Partial<ImageServiceTryStore> {
  const level = getImageServiceLevel(imageService);
  const version = getImageServiceVersion(imageService);

  // @todo check if format needs to be overriddent (if jpg is not supported)
  // @todo decide when the image service is sufficiently loaded.
  const fullTiles = [];
  const tiles = imageService.tiles || [];
  // If we have a width and height, then we can calculate the full tiles.
  if (imageService.width && imageService.height) {
    for (const tile of tiles) {
      for (const scale of tile.scaleFactors || []) {
        // We need to check if the scale factor means that there is only ONE tile at the given
        // factor - then we can add it as an extra size.
        //
        // @todo is this going to be specific? Do we need to add both Math.ciel and Math.floor variants
        // and then manually check them.
        const width = Math.ceil(imageService.width / scale);
        const height = Math.ceil(imageService.height / scale);
        if (
          width <= tile.width &&
          height <= (tile.height || tile.width)
        ) {
          fullTiles.push({ width, height, scale });
        }
      }
    }
  }

  const formats = ['jpg'];
  const context = Array.isArray(imageService['@context']) ? imageService['@context'] : imageService['@context'] ? [imageService['@context']] : [];

  if (level === 2) {
    formats.push('png');
  }

  for (const singleContext of context) {
    if (typeof singleContext === 'string') continue;
    if ('formats' in singleContext) {
      for (const format of (singleContext as any).formats) {
        if (formats.indexOf(format) === -1) {
          formats.push(format);
        }
      }
    }
  }
  if (imageService.extraFormats && imageService.extraFormats.length) {
    for (const format of imageService.extraFormats) {
      if (formats.indexOf(format) === -1) {
        formats.push(format);
      }
    }
  }

  const qualities = ['default'];
  for (const singleContext of context) {
    if (typeof singleContext === 'string') continue;
    if ('qualities' in singleContext) {
      for (const quality of (singleContext as any).qualities) {
        if (qualities.indexOf(quality) === -1) {
          qualities.push(quality);
        }
      }
    }
  }
  if (imageService.extraQualities && imageService.extraQualities.length) {
    for (const quality of imageService.extraQualities) {
      if (qualities.indexOf(quality) === -1) {
        qualities.push(quality);
      }
    }
  }

  return {
    fullService: isFullyLoaded ? imageService : null,
    sizes: imageService.sizes,
    tiles: imageService.tiles,
    isFullyLoaded,
    level: level as 0 | 1 | 2,
    version,
    formats,
    qualities,
    maxArea: imageService.maxArea || Infinity,
    maxWidth: imageService.maxWidth || imageService.width || Infinity,
    maxHeight: imageService.maxHeight || imageService.height || Infinity,
    tileSizes: ((imageService.tiles || []).map((tile) => tile.width || tile.height).filter(Boolean)) as number[],

    // @todo use the tiles to figure out what the image size requests are for each scale factor.
    fullTiles,
    features: {
      cors: supports(imageService, { extraFeatures: ['cors'] })[0],
      corsVerified: false, // @todo maybe look up a global cache?
      sizeByWh: supports(imageService, { extraFeatures: ['sizeByWh'] })[0],
      sizeByW: supports(imageService, { extraFeatures: ['sizeByW'] })[0],
      sizeByH: supports(imageService, { extraFeatures: ['sizeByH'] })[0],
      sizeByWhListed: imageService.sizes ? true : supports(imageService, { extraFeatures: ['sizeByWhListed'] })[0],
    },
  }
}

export function createImageServiceTryStore({ imageService, loader, events }: {
  imageService: string | ImageService,
  loader: StoreApi<ImageServiceStore>,
  events: Emitter<ImageServiceTryStoreEvents>
}) {
  const infoServiceId = typeof imageService === 'string' ? imageService : (imageService.id || imageService['@id']) as string;
  const imageServiceInfoJson = canonicalServiceUrl(infoServiceId);
  const imageServer = parseImageServiceUrl(imageServiceInfoJson);
  const store = createStore<ImageServiceTryStore & ImageServiceTryStoreMethods>((set, get) => {

    function filterSizesBasedOnConstraints(sizes: ImageSize[], constraints: TryConstraints) {
      return sizes.filter((size) => {
        if (size.width < constraints.minWidth) return false;
        if (size.height < constraints.minHeight) return false;
        if (size.width * size.height < constraints.minArea) return false;
        if (size.width > constraints.maxWidth) return false;
        if (size.height > constraints.maxHeight) return false;
        if (size.width * size.height > constraints.maxArea) return false;
        return true;
      });
    }

    function checkQueue(state: ImageServiceTryStore) {
      const size = state.tryQueue.length
      let cursor = state.tryCursor;
      let constraints = { ...state.constraints };
      // @todo loop?
      const pendingState = {
        failedConstraints: [] as Array<{ index: number; error: string }>
      };

      const getFailedConstraintState = (state: ImageServiceTryStore): Partial<ImageServiceTryStore> => {
        return {
          tryQueue: state.tryQueue.map((item, idx) => {
            if (idx <= cursor) {
              return item;
            }

            if (item.isFetching) {
              return item;
            }

            const found = pendingState.failedConstraints.find((failed) => failed.index === idx);
            if (found) {
              return {
                ...item,
                isFetching: false,
                isError: true,
                isSuccess: false,
                error: found.error,
              }
            }
            return item;
          }),
        };
      };

      // Only if the current is invalid.
      if (cursor !== -1) {
        const current = state.tryQueue[cursor];
        if (current && !current.error && current.id) {
          return state;
        }
      }

      while (cursor < size) {
        cursor++;
        // Let's continue through the queue.
        const next = state.tryQueue[cursor];
        if (!next) {
          break;
        }
        constraints = { ...state.constraints, ...next.constraints };

        const [url, error] = validImageFromConstraints(constraints);

        if (error) {
          pendingState.failedConstraints.push({ index: cursor, error });
          continue;
        }
        if (url) {
          return {
            ...getFailedConstraintState(state),
            tryCursor: cursor,
          };
        }
      }

      // If we get here, then we have exhausted all the options.
      return {
        ...getFailedConstraintState(state),
        tryCursor: cursor,
      };

    }

    function validImageFromConstraints(constraints: TryConstraints): [null | string, null | string] {
      try {
        const state = get();
        // Filter feature constraints
        // - region
        // - rotation
        // - quality
        // - format
        //
        // If these are not supported, no image can be generated.
        if (!constraints.region.full) {
          // Check if the region is supported.
          if (state.level === 0) {
            return [null, "Region is not supported"];
          }
          if (state.level === 1) {
            // If it's level 1, then it supports regionByPx.
            if (
              // @todo we could also check the profile.
              constraints.region.square ||
              constraints.region.percent
            ) {
              return [null, "Region is not supported"];
            }
          }
          // Level 2 supports all regions.
        }

        if (constraints.rotation.angle !== 0) {
          if (state.level === 0 || state.level === 1) {
            return [null, "Rotation is not supported"];
          }
          if (state.level === 2) {
            if (constraints.rotation.angle % 90 !== 0) {
              const service = state.fullService || state.originalService;
              const supportsRotationArbitrary = service && supports(service, { extraFeatures: ['rotationArbitrary'] })
              if (!supportsRotationArbitrary) {
                return [null, "Rotation is not supported"];
              }
            }
            if (constraints.rotation.mirror) {
              const service = state.fullService || state.originalService;
              const supportsMirroring = service && supports(service, { extraFeatures: ['mirroring'] })
              if (!supportsMirroring) {
                return [null, "Rotation is not supported"];
              }
            }
          }
        }

        if (constraints.quality !== 'default') {
          if (state.qualities.indexOf(constraints.quality) === -1) {
            return [null, "Quality is not supported"];
          }
        }


        // 1. Check sizes.
        const validSizes = filterSizesBasedOnConstraints(state.sizes, constraints);
        if (validSizes) {
          const byClosest = validSizes.sort((a, b) => {
            return Math.abs(a.width - constraints.width) - Math.abs(b.width - constraints.width);
          });
          const largest = byClosest[0];
          if (largest) {
            return [state.generateImageUrlAtSize({ width: largest.width, height: largest.height, max: false, version: state.version as any }), null];
          }
        }

        // 2. Check image sizes.
        const validFullTiles = filterSizesBasedOnConstraints(state.fullTiles, constraints);
        if (validFullTiles) {
          const byClosest = validFullTiles.sort((a, b) => {
            return Math.abs(a.width - constraints.width) - Math.abs(b.width - constraints.width);
          });
          const byLargest = validFullTiles.sort((a, b) => {
            return (b.width * b.height) - (a.width * a.height);
          });
          const largest = byClosest[0];
          if (largest) {
            return [state.generateImageUrlAtSize({ width: largest.width, height: largest.height, max: false, version: state.version as any }), null];
          }
        }

        // 4. Check if level 2 - then check max area.
        notValid: if (state.level === 2) {
          // Check max sizes.
          const maxArea = state.maxArea;
          const maxWidth = state.maxWidth;
          const maxHeight = state.maxHeight;

          // Check if the constraints are valid.
          if (constraints.maxArea > maxArea) break notValid;
          if (constraints.maxWidth > maxWidth) break notValid;
          if (constraints.maxHeight > maxHeight) break notValid;


          // Can we generate an unsafe image service request?
          return [state.generateImageUrlAtSize({ width: constraints.width, height: constraints.height, max: true, version: state.version as any }), null];
        }
      } catch (err) {
        return [null, (err as any || {}).message || 'unknown error (1)'];
      }
      return [null, "Unknown error (2)"];
    }


    return ({
      imageServer,
      imageServiceInfoJson,
      originalService: typeof imageService === 'string' ? null : imageService,
      fullService: null,

      sizes: [],
      tiles: [],
      formats: [],
      qualities: [],

      isFullyLoaded: false,
      isLoading: false,
      didError: false,
      error: null,

      level: null,
      version: null,
      maxArea: 0,
      maxWidth: 0,
      maxHeight: 0,
      tileSizes: [],
      fullTiles: [],
      supportsArbitrarySizes: false,
      supportsSizeByWhListed: false,

      options: {
        cors: false,
        headers: {},
        rounding: 'ceil',
        sizePriority: 'largest-size',
        stitch: false,
        unsafe: true,
        placeholder: null,
      },
      constraints: {
        profile: null, // sensible defaults - means all.
        height: 256, // sensible defaults?
        width: 256, // sensible defaults?
        maxArea: Infinity,
        maxWidth: Infinity,
        maxHeight: Infinity,
        minWidth: 0,
        minHeight: 0,
        minArea: 0,
        region: { full: true },
        rotation: { angle: 0 },
        quality: "default",
        format: "jpg",
      },

      tryCursor: -1,
      tryQueue: [],

      fallback: null,
      defaultImage: null,

      features: {
        cors: false,
        corsVerified: false,
        sizeByWh: false,
        sizeByW: false,
        sizeByH: false,
        sizeByWhListed: false,
      },

      ...(typeof imageService === 'string' ? {} : imageServiceToState(imageService)),

      ingestImageService(imageService, isFullyLoaded = false) {
        if (isFullyLoaded) {
          events.emit('fully-loaded', { imageService });
          set(state => checkQueue({
            ...state,
            ...imageServiceToState(imageService, isFullyLoaded),
            tryCursor: -1, // Reset the cursor?
          }))
        } else {
          set(imageServiceToState(imageService, isFullyLoaded));
        }
      },

      generateImageUrlAtSize(sizeRequest) {
        const state = get();
        const size = { ...sizeRequest, version: state.version as any, confined: false, max: false, upscaled: false };
        const serverDetails = state.imageServer;
        const [infoJson, ...parts] = serverDetails.path.split('/').reverse();
        const identifier = parts.reverse().join('/');

        return imageServiceRequestToString({
          ...serverDetails,
          identifier,
          prefix: serverDetails.prefix,
          originalPath: serverDetails.path,
          format: state.constraints.format,
          region: state.constraints.region,
          size,
          rotation: state.constraints.rotation,
          quality: state.constraints.quality,
          type: "image",
        });
      },

      sizeByWh(width, height) {
        const state = get();
        if (!state.features.sizeByWh) {
          throw new Error("Size by width and height not supported");
        }
        return state.generateImageUrlAtSize({ width, height });
      },

      sizeByW(width) {
        const state = get();
        if (!state.features.sizeByW) {
          throw new Error("Size by width not supported");
        }
        return state.generateImageUrlAtSize({ width });
      },

      sizeByH(height) {
        const state = get();
        if (!state.features.sizeByH) {
          throw new Error("Size by height not supported");
        }
        return state.generateImageUrlAtSize({ height });
      },

      sizeByWhListed(size) {
        const state = get();
        if (!state.features.sizeByWhListed) {
          throw new Error("Size by width and height listed not supported");
        }
        return state.generateImageUrlAtSize(size);
      },

      async requestImageService() {
        const id = get().imageServiceInfoJson;
        const originalService = get().originalService;
        const fullService = get().fullService;
        if (fullService) {
          return;
        }
        set({ isLoading: true });
        const serviceToLoad = originalService || { id } as any;
        loader.getState().loadService(serviceToLoad).then((imageService) => {
          if (imageService) {
            set(state => checkQueue({
              ...state,
              ...imageServiceToState(imageService),
              isLoading: false,
              isFullyLoaded: true,
              tryCursor: -1, // Reset the cursor?
            }));
            events.emit('fully-loaded', { imageService });
          }
        }).catch(err => {
          set({
            isLoading: false,
            didError: true,
            error: (err as any || {}).message || 'unknown error (3)'
          });
        })
      },

      try(tryOptions, asyncOptions) {
        const { cors, headers, unsafe, stitch, sizePriority, ...tryConstraints } = tryOptions;

        const options: Partial<TryOptions> = {};
        if (typeof cors !== 'undefined') {
          options.cors = cors;
        }
        if (typeof headers !== 'undefined') {
          options.headers = headers;
        }
        if (typeof unsafe !== 'undefined') {
          options.unsafe = unsafe;
        }
        if (typeof stitch !== 'undefined') {
          options.stitch = stitch;
        }
        if (typeof sizePriority !== 'undefined') {
          options.sizePriority = sizePriority;
        }

        if (Object.keys(tryConstraints).length === 0) {
          set(state => ({ options: { ...state.options, ...options } }));
        }

        const [url, error] = validImageFromConstraints({ ...get().constraints, ...tryConstraints });

        // @todo cursor issue.
        // If we don't currently have a successful image AND we are at the end of the queue,
        // then we should set our current image to the new image.

        set((state) => {
          return checkQueue({
            ...state,
            options: {
              ...state.options,
              ...options
            },
            tryQueue: [...state.tryQueue, {
              id: url,
              isAsync: !!asyncOptions,
              isFetching: !!(asyncOptions?.loadService && !state.isFullyLoaded),
              isVerifying: asyncOptions?.verifyImage || false,
              isVerified: false, // @todo check global cache?
              isError: !!error,
              error: error,
              constraints: tryConstraints
            }]
          });
        });
      },
      async asyncTry(options) {
        const { loadService, verifyImage, ...tryOptions } = options;
        // 1. Sync try.
        get().try(tryOptions, { loadService, verifyImage });

        if (loadService) {
          await get().requestImageService();
          set(checkQueue);
        }

        if (verifyImage) {
          //const image = await get().asyncImage();
          // @todo verify image.
        }

        // 2. Set up events and resolve when done.
        return get().image();
      },

      image() {
        const state = get();

        const cursor = state.tryCursor;
        const current = cursor === -1 ? null : state.tryQueue[cursor];
        // Happy path.
        if (current && !current.isError && !current.error && current.id) {
          return current.id;
        }

        const size = state.tryQueue.length;
        // If we have a fallback, then return that.
        if (cursor >= size) {
          return state.fallback || state.defaultImage;
        }

        // @todo keep going through?

        return null;
      },

      constrain(constraints) {
        set((state) => {
          // @todo maybe reset the cursor back to 0? Also how should these constraints be merged?
          return checkQueue({
            ...state,
            constraints: {
              ...state.constraints,
              ...constraints
            }
          });
        });
      },

      async asyncImage() {
        // 1. Wait for image service to be loaded.
        return null;
      },

      async test() {
        //
      },
    });
  });

  return store;
}


class ImageServiceTryBuilder {
  imageServiceLoader: ImageServiceLoader;
  abortController: AbortController;

  constructor(public imageService: ImageService, options?: { loader?: ImageServiceLoader; abortController?: AbortController }) {
    this.imageServiceLoader = options?.loader || imageServiceLoader;
    this.abortController = options?.abortController || new AbortController();
  }

  try() {
    //
  }

  tryExact() {
    //
  }

  tryExactAsync() {
    //
  }

  asyncTry() {
    //
  }

  crop() {
    //
  }

  rotate() {
    //
  }

  format() {
    //
  }

  region() {
    //
  }

  rotation() {
    //
  }

  image() {
    //
  }

  asyncImage() {
    //
  }

  test() {
    //
  }

  fail() {
    //
  }

  defaultTo() {
    //
  }

  full() {
    //
  }

  getStore() {
    //
  }

  getSizesImages() {
    //
  }

  abort() {
    //
  }
}
