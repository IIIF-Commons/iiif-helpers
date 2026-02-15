import type {
  IIIFExternalWebResource as IIIFExternalWebResourceV3,
  InternationalString as InternationalStringV3,
  SpecificResource as SpecificResourceV3,
} from '@iiif/parser/presentation-3/types';
import type { AnnotationNormalized as AnnotationNormalizedV3 } from '@iiif/parser/presentation-3-normalized/types';
import type {
  ContentResourceLike as ContentResourceLikeV4,
  LanguageMap as InternationalStringV4,
  SpecificResource as SpecificResourceV4,
} from '@iiif/parser/presentation-4/types';
import type { AnnotationNormalized as AnnotationNormalizedV4 } from '@iiif/parser/presentation-4-normalized/types';
import { BoxStyle, SelectorTransform, TransformPoint } from '../annotation-targets/selector-types';

type InternationalString = InternationalStringV3 | InternationalStringV4;
type PaintableResource = IIIFExternalWebResourceV3 | SpecificResourceV3 | ContentResourceLikeV4 | SpecificResourceV4;
type AnnotationNormalized = AnnotationNormalizedV3 | AnnotationNormalizedV4;

export interface SingleChoice {
  type: 'single-choice';
  label?: InternationalString;
  items: Array<{
    id: string;
    label?: InternationalString;
    selected?: true;
  }>;
}

export interface ComplexChoice {
  type: 'complex-choice';
  items: SingleChoice[];
}

export type ChoiceDescription = SingleChoice | ComplexChoice;

export interface Paintables {
  choice: ChoiceDescription | null;
  allChoices: ComplexChoice | null;
  types: string[];
  items: Array<{
    type: string;
    resource: PaintableResource;
    annotationId: string;
    annotation: AnnotationNormalized;
    target: any;
    selector: any;
    styleClass?: string;
    style?: BoxStyle;
    rotation?: number;
    rotationOrigin?: TransformPoint;
    translate?: TransformPoint;
    transform?: SelectorTransform;
  }>;
}
