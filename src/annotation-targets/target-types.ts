import type { ExternalWebResource as ExternalWebResourceV3 } from '@iiif/parser/presentation-3/types';
import type {
  ContentResourceLike as ContentResourceLikeV4,
  ResourceReference as ResourceReferenceV4,
} from '@iiif/parser/presentation-4/types';
import type { SupportedSelectors } from './selector-types';

type ExternalWebResource = ExternalWebResourceV3 | ContentResourceLikeV4 | ResourceReferenceV4;

export type SupportedTarget = {
  type: 'SpecificResource';
  source:
    | ExternalWebResource
    | {
        id: string;
        type: 'Unknown' | 'Canvas' | 'Range' | 'Manifest';
        partOf?: Array<{ id: string; type: string }>;
      };
  purpose?: string;
  imageServiceHints?: {
    size?: string;
    rotation?: string;
    quality?: string;
    format?: string;
  };
  transform?: unknown[];
  action?: unknown[];
  selector: SupportedSelectors | null;
  selectors: SupportedSelectors[];
};
