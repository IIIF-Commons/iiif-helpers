import { ChoiceBody, CollectionItemSchemas, ContentResource, Reference } from '@iiif/presentation-3';
import {
  AnnotationNormalized,
  AnnotationPageNormalized,
  CanvasNormalized,
  CollectionNormalized,
  DescriptiveNormalized,
  ManifestNormalized,
} from '@iiif/presentation-3-normalized';
import {
  FixedSizeImage,
  FixedSizeImageService,
  getFixedSizeFromImage,
  ImageCandidate,
  ImageCandidateRequest,
  ImageServiceLoader,
  UnknownSizeImage,
  VariableSizeImage,
} from '@atlas-viewer/iiif-image-api';
import { compatVault, CompatVault } from './compat';

export const imageServiceLoader = new ImageServiceLoader();

let helper: ReturnType<typeof createThumbnailHelper> | null = null;
export function getThumbnail(
  input:
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
    | undefined,
  {
    vault = compatVault,
    dereference = false,
    ...options
  }: ImageCandidateRequest & { vault?: CompatVault; dereference?: boolean } = {}
) {
  helper = helper || createThumbnailHelper(vault);
  return helper.getBestThumbnailAtSize(input, options, dereference);
}

export function createThumbnailHelper(
  vault: CompatVault = compatVault,
  dependencies: { imageServiceLoader?: ImageServiceLoader } = {}
) {
  const loader = dependencies.imageServiceLoader || imageServiceLoader;

  async function getBestThumbnailAtSize(
    input:
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
      | undefined,
    request: ImageCandidateRequest,
    dereference?: boolean,
    candidates: Array<ImageCandidate> = [],
    dimensions?: { width: number; height: number }
  ): Promise<{
    best: null | undefined | FixedSizeImage | FixedSizeImageService | VariableSizeImage | UnknownSizeImage;
    fallback: Array<ImageCandidate>;
    log: string[];
  }> {
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
      return { best: getFixedSizeFromImage(fullInput as any), fallback: [], log: [] };
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
        // @todo this could be configuration.
        const firstContentResources = vault.get(contentResources[0]);
        if (dimensions && !(firstContentResources as any).width) {
          (firstContentResources as any).width = dimensions.width;
          (firstContentResources as any).height = dimensions.height;
        }

        return await loader.getThumbnailFromResource(firstContentResources as any, request, dereference, candidates);
      }

      case 'Canvas': {
        const canvas = fullInput as CanvasNormalized;

        return getBestThumbnailAtSize(canvas.items[0], request, dereference, candidates, {
          width: canvas.width,
          height: canvas.height,
        });
      }

      // Unsupported for now.
      case 'AnnotationPage': {
        const annotationPage = fullInput as AnnotationPageNormalized;
        return getBestThumbnailAtSize(annotationPage.items[0], request, dereference, candidates, dimensions);
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
        return getBestThumbnailAtSize(firstManifest, request, dereference, candidates, dimensions);
      }

      case 'Manifest': {
        const manifest = fullInput as ManifestNormalized;
        const firstCanvas = manifest.items[0];
        if (!firstCanvas) {
          return await thumbnailNotFound();
        }
        return getBestThumbnailAtSize(firstCanvas, request, dereference, candidates, dimensions);
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
