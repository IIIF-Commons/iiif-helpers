import type { Selector, Transform } from '@iiif/parser/presentation-4/types';
import type { SceneAnnotation, SceneResource } from '../scenes/types';

export type ActivationStep = {
  source: SceneResource | null;
  sourceRef: unknown;
  selector: Selector | Selector[] | null;
  transform: Transform[];
  actions: unknown[];
};

export type ActivationTransaction = {
  annotationId: string;
  annotation: SceneAnnotation;
  steps: ActivationStep[];
};
