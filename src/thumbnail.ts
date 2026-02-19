import type {
  ChoiceBody as ChoiceBodyV3,
  CollectionItemSchemas as CollectionItemSchemasV3,
  ContentResource as ContentResourceV3,
  Reference as ReferenceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV3,
  AnnotationPageNormalized as AnnotationPageNormalizedV3,
  CanvasNormalized as CanvasNormalizedV3,
  CollectionNormalized as CollectionNormalizedV3,
  DescriptiveNormalized as DescriptiveNormalizedV3,
  ManifestNormalized as ManifestNormalizedV3,
} from '@iiif/parser/presentation-3-normalized/types';
import type {
  ChoiceResource as ChoiceBodyV4,
  CollectionItemSchemas as CollectionItemSchemasV4,
  ContentResource as ContentResourceV4,
  Reference as ReferenceV4,
} from '@iiif/parser/presentation-4/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV4,
  AnnotationPageNormalized as AnnotationPageNormalizedV4,
  CanvasNormalized as CanvasNormalizedV4,
  CollectionNormalized as CollectionNormalizedV4,
  DescriptiveNormalized as DescriptiveNormalizedV4,
  ManifestNormalized as ManifestNormalizedV4,
} from '@iiif/parser/presentation-4-normalized/types';
import { type CompatVault, compatVault } from './compat';
import {
  type FixedSizeImage,
  type FixedSizeImageService,
  getFixedSizeFromImage,
  type ImageCandidate,
  type ImageCandidateRequest,
  ImageServiceLoader,
  type UnknownSizeImage,
  type VariableSizeImage,
} from './image-service';

export const imageServiceLoader = new ImageServiceLoader();

type Reference<T extends string = string> = ReferenceV3<T> | ReferenceV4<T>;
type CollectionItemSchemas = CollectionItemSchemasV3 | CollectionItemSchemasV4;
type CollectionNormalized = CollectionNormalizedV3 | CollectionNormalizedV4;
type ManifestNormalized = ManifestNormalizedV3 | ManifestNormalizedV4;
type CanvasNormalized = CanvasNormalizedV3 | CanvasNormalizedV4;
type AnnotationNormalized = AnnotationNormalizedV3 | AnnotationNormalizedV4;
type AnnotationPageNormalized = AnnotationPageNormalizedV3 | AnnotationPageNormalizedV4;
type ContentResource = ContentResourceV3 | ContentResourceV4;
type ChoiceBody = ChoiceBodyV3 | ChoiceBodyV4;
type DescriptiveNormalized = DescriptiveNormalizedV3 | DescriptiveNormalizedV4;

export type ThumbnailInput =
  | string
  | Reference<CollectionItemSchemas>
  | Reference<'Collection'>
  | Reference<'Manifest'>
  | Reference<'Canvas'>
  | Reference<'Annotation'>
  | Reference<'AnnotationPage'>
  | Reference<'ContentResource'>
  | CollectionNormalized
  | ManifestNormalized
  | CanvasNormalized
  | AnnotationNormalized
  | AnnotationPageNormalized
  | ContentResource
  | undefined;

export type ThumbnailOutput = Promise<{
  best: null | undefined | FixedSizeImage | FixedSizeImageService | VariableSizeImage | UnknownSizeImage;
  fallback: Array<ImageCandidate>;
  log: string[];
}>;

const helpers: Map<CompatVault, ReturnType<typeof createThumbnailHelper>> = new Map();
export function getThumbnail(
  input: ThumbnailInput,
  {
    vault = compatVault,
    dereference = false,
    ...options
  }: ImageCandidateRequest & {
    vault?: CompatVault;
    dereference?: boolean;
  } = {}
) {
  let helper = helpers.get(vault);
  if (!helper) {
    helper = createThumbnailHelper(vault);
    helpers.set(vault, helper);
  }
  return helper.getBestThumbnailAtSize(input, options, dereference);
}

export function createThumbnailHelper(
  vault: CompatVault = compatVault,
  dependencies: { imageServiceLoader?: ImageServiceLoader } = {}
) {
  const loader = dependencies.imageServiceLoader || imageServiceLoader;

  async function getBestThumbnailAtSize(
    input: ThumbnailInput,
    request: ImageCandidateRequest,
    dereference = false,
    candidates: Array<ImageCandidate> = [],
    dimensions?: { width: number; height: number }
  ): ThumbnailOutput {
    const thumbnailNotFound = () => loader.getThumbnailFromResource(undefined as any, request, dereference, candidates);

    if (!input) {
      // We might have candidates already to pick from.
      return await loader.getThumbnailFromResource(undefined as any, request, dereference, candidates);
    }

    if (typeof input === 'string') {
      const fixed = getFixedSizeFromImage(input as any);
      if (fixed) {
        candidates.push(fixed);
      }

      return await loader.getThumbnailFromResource(undefined as any, request, dereference, candidates);
    }

    // Run through from ref, just in case.
    const fullInput:
      | string
      | ManifestNormalized
      | CollectionNormalized
      | CanvasNormalized
      | AnnotationNormalized
      | AnnotationPageNormalized
      | ContentResource
      | ChoiceBody
      | undefined = vault.get(input as any, { skipSelfReturn: false }) as any;

    if (typeof fullInput === 'string') {
      return {
        best: getFixedSizeFromImage(fullInput as any),
        fallback: [],
        log: [],
      };
    }

    if (!fullInput) {
      return await thumbnailNotFound();
    }

    const parseThumbnail = async (resource: DescriptiveNormalized) => {
      if (resource && resource.thumbnail && resource.thumbnail.length) {
        const thumbnail = vault.get(resource.thumbnail[0]);
        const potentialThumbnails = await loader.getImageCandidates(thumbnail as any, dereference);
        if (potentialThumbnails && potentialThumbnails.length) {
          candidates.push(...potentialThumbnails);
        }
      }
    };

    await parseThumbnail(fullInput as any);

    switch (fullInput.type) {
      case 'Annotation': {
        // Grab the body.
        const contentResources = Array.isArray(fullInput.body) ? fullInput.body : [fullInput.body];
        if (!contentResources[0]) {
          return await thumbnailNotFound();
        }
        // @todo this could be configuration.
        const firstContentResources = vault.get(contentResources[0] as any);
        if (dimensions && !(firstContentResources as any).width) {
          (firstContentResources as any).width = dimensions.width;
          (firstContentResources as any).height = dimensions.height;
        }

        return await loader.getThumbnailFromResource(firstContentResources as any, request, dereference, candidates);
      }

      case 'Canvas': {
        const canvas = fullInput as CanvasNormalized;

        return getBestThumbnailAtSize(canvas.items[0] as any, request, dereference, candidates, {
          width: canvas.width,
          height: canvas.height,
        });
      }

      // Unsupported for now.
      case 'AnnotationPage': {
        const annotationPage = fullInput as AnnotationPageNormalized;
        return getBestThumbnailAtSize(annotationPage.items[0] as any, request, dereference, candidates, dimensions);
      }

      case 'Choice': {
        const choice = fullInput;
        if (!choice.items || choice.items[0]) {
          return await thumbnailNotFound();
        }
        // @todo this could also be configuration, just choosing the first choice.
        return getBestThumbnailAtSize(choice.items[0] as any, request, dereference, candidates, dimensions);
      }
      case 'Collection': {
        // This one is tricky, as the manifests may not have been loaded. But we will give it a shot.
        const collection = fullInput as CollectionNormalized;
        const firstManifest = collection.items[0];
        if (!firstManifest) {
          return await thumbnailNotFound();
        }
        return getBestThumbnailAtSize(firstManifest as any, request, dereference, candidates, dimensions);
      }

      case 'Manifest': {
        const manifest = fullInput as ManifestNormalized;
        const firstCanvas = manifest.items[0];
        if (!firstCanvas) {
          return await thumbnailNotFound();
        }
        return getBestThumbnailAtSize(firstCanvas as any, request, dereference, candidates, dimensions);
      }

      case 'SpecificResource':
      case 'Image':
      case 'Dataset':
      case 'Sound':
      case 'Text':
      case 'TextualBody':
      case 'Video':
        if (dimensions && !(fullInput as any).width) {
          (fullInput as any).width = dimensions.width;
          (fullInput as any).height = dimensions.height;
        }

        return loader.getThumbnailFromResource(fullInput as any, request, dereference, candidates);

      // Seems unlikely these would appear, but it would be an error..
      // case 'Service': // @todo could do something with vault.
      // case 'Range':
      // case 'AnnotationCollection':
      // case 'CanvasReference':
      // case 'ContentResource':
      //   return await thumbnailNotFound();
    }

    return await thumbnailNotFound();
  }

  return {
    getBestThumbnailAtSize,
  };
}
