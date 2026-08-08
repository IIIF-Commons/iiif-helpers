import type { InternationalString } from "@iiif/parser/presentation-3/types";
import type { ExcludeType, Selector, Transform } from "@iiif/parser/presentation-4/types";
import type { AnnotationNormalized, SceneNormalized } from "@iiif/parser/presentation-4-normalized/types";
import type { AnnotationAggregateStep } from "../annotation-values";
import type { ChoiceDescription, ComplexChoice } from "../painting-annotations/types";
import type { SceneTarget, SelectorChain } from "./target";

export const KNOWN_SCENE_PAINTABLE_TYPES = [
  "model",
  "scene",
  "canvas",
  "perspective-camera",
  "orthographic-camera",
  "ambient-light",
  "directional-light",
  "image-based-light",
  "point-light",
  "spot-light",
  "ambient-audio",
  "point-audio",
  "spot-audio",
  "unknown",
] as const;

export type KnownScenePaintableType = (typeof KNOWN_SCENE_PAINTABLE_TYPES)[number];
export type ScenePaintableType = KnownScenePaintableType;

const knownScenePaintableTypeSet: ReadonlySet<string> = new Set(KNOWN_SCENE_PAINTABLE_TYPES);

export function isKnownScenePaintableType(type: string): type is KnownScenePaintableType {
  return knownScenePaintableTypeSet.has(type);
}

export function normalizeScenePaintableType(type: unknown): {
  type: ScenePaintableType;
  rawType: string;
} {
  if (typeof type !== "string" || !type) return { type: "unknown", rawType: "Unknown" };
  const normalized = type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return { type: isKnownScenePaintableType(normalized) ? normalized : "unknown", rawType: type };
}

export type SceneAnnotation = AnnotationNormalized & {
  label?: InternationalString | null;
  behavior?: readonly string[];
  exclude?: readonly ExcludeType[];
  timeMode?: string | null;
  [key: string]: unknown;
};

export type SceneRenderableResource = {
  id: string;
  type: string;
  label?: unknown;
  behavior?: readonly string[];
  selector?: Selector | readonly Selector[];
  transform?: Transform | readonly Transform[];
  action?: unknown | readonly unknown[];
  [key: string]: unknown;
};

export type ScenePaintable = {
  type: ScenePaintableType;
  rawType: string;
  annotationId: string;
  annotation: SceneAnnotation;
  resource: SceneRenderableResource;
  target: SceneTarget;
  bodySelector: SelectorChain | null;
  bodyTransform: readonly Transform[];
  bodyAction: readonly string[];
  behavior: readonly string[];
  exclude: readonly ExcludeType[];
  timeMode: "trim" | "scale" | "loop" | string;
  aggregatePath: readonly AnnotationAggregateStep[];
};

export type ScenePaintables = {
  scene: SceneNormalized;
  types: ScenePaintableType[];
  rawTypes: string[];
  availableTypes: typeof KNOWN_SCENE_PAINTABLE_TYPES;
  items: ScenePaintable[];
  choice: ChoiceDescription | null;
  allChoices: ComplexChoice | null;
};
