import type { Selector, Transform } from "@iiif/parser/presentation-4/types";
import type { AnnotationAggregateStep } from "../annotation-values";
import type { SceneAnnotation, SceneRenderableResource } from "../scenes/types";

export const KNOWN_ACTIVATION_ACTIONS = [
  "show",
  "hide",
  "enable",
  "disable",
  "start",
  "stop",
  "reset",
  "select",
] as const;
export type KnownActivationAction = (typeof KNOWN_ACTIVATION_ACTIONS)[number];

export type ActivationStep = {
  source: SceneRenderableResource | null;
  sourceRef: unknown;
  selector: Selector | readonly Selector[] | null;
  transform: readonly Transform[];
  actions: readonly string[];
  aggregatePath: readonly AnnotationAggregateStep[];
};

export type ActivationTransaction = {
  annotationId: string;
  annotation: SceneAnnotation;
  triggerIds: readonly string[];
  steps: readonly ActivationStep[];
};
