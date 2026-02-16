import type {
  Annotation,
  AnnotationCollection,
  AnnotationPage,
  Canvas,
  Collection,
  ContentResource,
  Manifest,
  ResourceProvider,
  Selector,
  Service,
} from '@iiif/parser/presentation-3/types';
import type {
  AnnotationNormalized,
  AnnotationPageNormalized,
  CanvasNormalized,
  CollectionNormalized,
  ManifestNormalized,
  RangeNormalized,
  ResourceProviderNormalized,
  ServiceNormalized,
} from '@iiif/parser/presentation-3-normalized/types';
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
  | AnnotationCollection
  | AnnotationNormalized
  | ContentResource
  | RangeNormalized
  | ServiceNormalized
  | ResourceProviderNormalized
  | Selector
  | GenericNormalizedEntity;

export type RefToNormalized<Ref extends { type?: string }> = Ref['type'] extends 'Manifest'
  ? ManifestNormalized
  : Ref['type'] extends 'Canvas'
    ? CanvasNormalized
    : Ref['type'] extends 'AnnotationPage'
      ? AnnotationPageNormalized
      : Ref['type'] extends 'AnnotationCollection'
        ? AnnotationCollection
        : Ref['type'] extends 'Annotation'
          ? AnnotationNormalized
          : Ref['type'] extends 'Range'
            ? RangeNormalized
            : Ref['type'] extends 'Service'
              ? ServiceNormalized
              : Ref['type'] extends 'ContentResource'
                ? ContentResource
                : Ref['type'] extends 'ResourceProvider'
                  ? ResourceProviderNormalized
                  : Ref['type'] extends 'Collection'
                    ? CollectionNormalized
                    : Ref['type'] extends 'Timeline'
                      ? GenericNormalizedEntity
                      : Ref['type'] extends 'Scene'
                        ? GenericNormalizedEntity
                        : Ref['type'] extends 'Quantity'
                          ? GenericNormalizedEntity
                          : Ref['type'] extends 'Transform'
                            ? GenericNormalizedEntity
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
                  : Ref['type'] extends 'Collection'
                    ? Collection
                    : Ref['type'] extends 'Timeline'
                      ? GenericNormalizedEntity
                      : Ref['type'] extends 'Scene'
                        ? GenericNormalizedEntity
                        : Ref['type'] extends 'Quantity'
                          ? GenericNormalizedEntity
                          : Ref['type'] extends 'Transform'
                            ? GenericNormalizedEntity
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
    [id: string]: AnnotationCollection;
  };
  Annotation: {
    [id: string]: AnnotationNormalized;
  };
  ContentResource: {
    [id: string]: ContentResource;
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
    [id: string]: ResourceProviderNormalized;
  };
  Timeline: {
    [id: string]: GenericNormalizedEntity;
  };
  Scene: {
    [id: string]: GenericNormalizedEntity;
  };
  Quantity: {
    [id: string]: GenericNormalizedEntity;
  };
  Transform: {
    [id: string]: GenericNormalizedEntity;
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
