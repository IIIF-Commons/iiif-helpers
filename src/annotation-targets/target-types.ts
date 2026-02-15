import { ExternalWebResource } from '@iiif/parser/presentation-3/types';
import { SupportedSelectors } from './selector-types';

export type SupportedTarget = {
  type: 'SpecificResource';
  source:
    | ExternalWebResource
    | { id: string; type: 'Unknown' | 'Canvas' | 'Range' | 'Manifest'; partOf?: Array<{ id: string; type: string }> };
  purpose?: string;
  imageServiceHints?: {
    size?: string;
    rotation?: string;
    quality?: string;
    format?: string;
  };
  selector: SupportedSelectors | null;
  selectors: SupportedSelectors[];
};
