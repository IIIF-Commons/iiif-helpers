import type {
  Annotation,
  AnnotationCollection,
  AnnotationPage,
  Canvas,
  Collection,
  ContentResource,
  Manifest,
  Range,
  ResourceProvider,
  Selector,
  Service,
} from '@iiif/parser/presentation-3/types';
import type {
  AnnotationCollectionNormalized,
  AnnotationNormalized,
  AnnotationPageNormalized,
  CanvasNormalized,
  CollectionNormalized,
  ManifestNormalized,
  RangeNormalized,
  ResourceProviderNormalized,
  ServiceNormalized,
} from '@iiif/parser/presentation-3-normalized/types';
import type { Agent as AgentV4, Scene, Timeline } from '@iiif/parser/presentation-4/types';
import type {
  AgentNormalized as AgentNormalizedV4,
  AnnotationCollectionNormalized as AnnotationCollectionNormalizedV4,
  ContentResourceNormalized as ContentResourceNormalizedV4,
  SceneNormalized,
  SpecificResourceNormalized,
  TimelineNormalized,
} from '@iiif/parser/presentation-4-normalized/types';
import type { PayloadAction } from 'typesafe-actions';
import type { EntityActions } from './actions/entity-actions';
import type { MappingActions } from './actions/mapping-actions';
import type { MetaActions } from './actions/meta-actions';
import type { RequestActions } from './actions/request-actions';

declare global {
  // Work around for something else.
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface A {}
}

export type GenericNormalizedEntity = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type MetaState = Record<string, Record<string, Record<string, any>>>;

export type RequestState = {
  [id: string]: {
    loadingState: 'RESOURCE_ERROR' | 'RESOURCE_LOADING' | 'RESOURCE_READY';
    uriMismatch: boolean;
    requestUri: string;
    resourceUri: string;
    error?: string;
  };
};

export type PaginationState = {
  pages: Array<{
    id: string;
    type: 'Collection';
    order: number;
    startIndex: number;
    pageLength: number;
  }>;
  page: number;
  totalItems?: number;
  totalPages?: number;
  currentLength: number;
  next: string | null;
  previous: string | null;
  currentPage: string | null;
  currentPageIndex: number | null;
  isFullyLoaded: boolean;
  isFetching: boolean;
  error?: any;
};

export type NormalizedEntity =
  | CollectionNormalized
  | ManifestNormalized
  | CanvasNormalized
  | AnnotationPageNormalized
  | AnnotationCollectionNormalized
  | AnnotationCollectionNormalizedV4
  | AnnotationCollection
  | AnnotationNormalized
  | ContentResourceNormalizedV4
  | SpecificResourceNormalized
  | ContentResource
  | RangeNormalized
  | ServiceNormalized
  | AgentNormalizedV4
  | ResourceProviderNormalized
  | Selector
  | TimelineNormalized
  | SceneNormalized
  | GenericNormalizedEntity;

export type RefToNormalized<Ref extends { type?: string }> = Ref['type'] extends 'Manifest'
  ? ManifestNormalized
  : Ref['type'] extends 'Canvas'
    ? CanvasNormalized
    : Ref['type'] extends 'AnnotationPage'
      ? AnnotationPageNormalized
      : Ref['type'] extends 'AnnotationCollection'
        ? AnnotationCollectionNormalized | AnnotationCollectionNormalizedV4 | AnnotationCollection
        : Ref['type'] extends 'Annotation'
          ? AnnotationNormalized
          : Ref['type'] extends 'Range'
            ? RangeNormalized
            : Ref['type'] extends 'Service'
              ? ServiceNormalized
              : Ref['type'] extends 'SpecificResource'
                ? SpecificResourceNormalized
                : Ref['type'] extends 'ContentResource'
                  ? ContentResource | ContentResourceNormalizedV4 | SpecificResourceNormalized
                  : Ref['type'] extends 'ResourceProvider'
                    ? ResourceProviderNormalized
                    : Ref['type'] extends 'Agent'
                      ? ResourceProviderNormalized | AgentNormalizedV4
                      : Ref['type'] extends 'Collection'
                        ? CollectionNormalized
                        : Ref['type'] extends 'Timeline'
                          ? TimelineNormalized
                          : Ref['type'] extends 'Scene'
                            ? SceneNormalized
                            : any;

export type RefToFull<Ref extends { type?: string }> = Ref['type'] extends 'Manifest'
  ? Manifest
  : Ref['type'] extends 'Canvas'
    ? Canvas
    : Ref['type'] extends 'AnnotationPage'
      ? AnnotationPage
      : Ref['type'] extends 'AnnotationCollection'
        ? AnnotationCollection
        : Ref['type'] extends 'Annotation'
          ? Annotation
          : Ref['type'] extends 'Range'
            ? Range
            : Ref['type'] extends 'Service'
              ? Service
              : Ref['type'] extends 'ContentResource'
                ? ContentResource
                : Ref['type'] extends 'ResourceProvider'
                  ? ResourceProvider
                  : Ref['type'] extends 'Agent'
                    ? ResourceProvider | AgentV4
                    : Ref['type'] extends 'Collection'
                      ? Collection
                      : Ref['type'] extends 'Timeline'
                        ? Timeline
                        : Ref['type'] extends 'Scene'
                          ? Scene
                          : any;

export type Entities = {
  Collection: {
    [id: string]: CollectionNormalized;
  };
  Manifest: {
    [id: string]: ManifestNormalized;
  };
  Canvas: {
    [id: string]: CanvasNormalized;
  };
  AnnotationPage: {
    [id: string]: AnnotationPageNormalized;
  };
  AnnotationCollection: {
    [id: string]: AnnotationCollectionNormalized | AnnotationCollectionNormalizedV4 | AnnotationCollection;
  };
  Annotation: {
    [id: string]: AnnotationNormalized;
  };
  ContentResource: {
    [id: string]: ContentResource | ContentResourceNormalizedV4 | SpecificResourceNormalized;
  };
  Range: {
    [id: string]: RangeNormalized;
  };
  Service: {
    [id: string]: any;
  };
  Selector: {
    [id: string]: Selector;
  };
  Agent: {
    [id: string]: ResourceProviderNormalized | AgentNormalizedV4;
  };
  Timeline: {
    [id: string]: TimelineNormalized;
  };
  Scene: {
    [id: string]: SceneNormalized;
  };
};

export type EntityStore<Meta extends MetaState = MetaState> = {
  entities: Entities;
  mapping: Record<string, string>;
  requests: RequestState;
  meta: Meta;
};

export type IIIFStore<Meta extends MetaState = MetaState> = {
  iiif: EntityStore<Meta>;
};

export type AllActions = MappingActions | RequestActions | EntityActions | MetaActions;

export type Reducer<TState, TAction> = (state: TState | undefined, action: TAction) => TState;

export type ActionFromType<Type, Actions extends PayloadAction<any, any> = AllActions> = Actions extends {
  type: Type;
}
  ? Actions
  : never;

// Ranges.
type ReparentDropEvent = {
  target: { type: 'root' } | { type: 'item'; key: any; dropPosition: 'on' | 'before' | 'after' };
};
