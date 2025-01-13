import { IIIFExternalWebResource, SpecificResource } from '@iiif/presentation-3';
import { InternationalString } from '@iiif/presentation-3';
import { AnnotationNormalized } from '@iiif/presentation-3-normalized';

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
    resource: IIIFExternalWebResource | SpecificResource;
    annotationId: string;
    annotation: AnnotationNormalized;
    target: any;
    selector: any;
  }>;
}
