import type { InternationalString } from '@iiif/parser/presentation-3/types';
import type { Selector, Transform } from '@iiif/parser/presentation-4/types';
import type { SceneNormalized } from '@iiif/parser/presentation-4-normalized/types';
import type { SupportedTarget } from '../annotation-targets/target-types';
import type { ChoiceDescription, ComplexChoice } from '../painting-annotations/types';

export const KNOWN_SCENE_PAINTABLE_TYPES = ['model'] as const;

export type KnownScenePaintableType = (typeof KNOWN_SCENE_PAINTABLE_TYPES)[number];
export type ScenePaintableType = KnownScenePaintableType | 'unknown';

const knownScenePaintableTypeSet: ReadonlySet<string> = new Set<string>(KNOWN_SCENE_PAINTABLE_TYPES);

export function isKnownScenePaintableType(type: string): type is KnownScenePaintableType {
  return knownScenePaintableTypeSet.has(type);
}

export function normalizeScenePaintableType(type: unknown): { type: ScenePaintableType; rawType: string } {
  if (typeof type !== 'string' || type.length === 0) {
    return { type: 'unknown', rawType: 'Unknown' };
  }

  const normalized = type.toLowerCase();
  if (isKnownScenePaintableType(normalized)) {
    return { type: normalized, rawType: type };
  }

  return { type: 'unknown', rawType: type };
}

export type SceneAnnotation = {
  id: string;
  type: string;
  motivation?: readonly string[] | string[];
  body?: unknown;
  target?: unknown;
  label?: InternationalString | null;
  bodyValue?: string;
  [key: string]: unknown;
};
export type SceneResource = {
  id?: string;
  type?: string;
  label?: unknown;
  color?: string;
  intensity?: { value?: number } | number;
  angle?: number;
  fieldOfView?: number;
  [key: string]: unknown;
};

export type ScenePaintable = {
  type: ScenePaintableType;
  rawType: string;
  annotationId: string;
  annotation: SceneAnnotation;
  resource: SceneResource;
  target: SupportedTarget | null;
  bodySelector: Selector | Selector[] | null;
  bodyTransform: Transform[];
  bodyAction: unknown[];
};

export type ScenePaintables = {
  scene: SceneNormalized;
  types: ScenePaintableType[];
  rawTypes: string[];
  availableTypes: readonly KnownScenePaintableType[];
  items: ScenePaintable[];
  choice: ChoiceDescription | null;
  allChoices: ComplexChoice | null;
};
