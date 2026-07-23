import type { InternationalString } from '@iiif/parser/presentation-3/types';
import type { ChoiceResource } from '@iiif/parser/presentation-4/types';
import type { SceneNormalized } from '@iiif/parser/presentation-4-normalized/types';
import { expandTarget } from '../annotation-targets/expand-target';
import { type CompatVault, compatVault } from '../compat';
import type { ComplexChoice } from '../painting-annotations/types';
import { parseSceneSpecificResource } from './parse-specific-resource';
import {
  KNOWN_SCENE_PAINTABLE_TYPES,
  normalizeScenePaintableType,
  type SceneAnnotation,
  type ScenePaintables,
  type SceneResource,
} from './types';

type SceneLike = SceneNormalized & {
  annotations?: ReadonlyArray<{ id: string; type: string }>;
};
type AnnotationPageLike = {
  id: string;
  type?: string;
  items?: unknown;
};
type ParentRef = {
  id: string;
  type: string;
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

function getMotivations(annotation: SceneAnnotation): string[] {
  const m = annotation?.motivation;
  return Array.isArray(m) ? [...m] : [];
}

function unwrapBodyList(body: unknown): unknown[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (typeof body === 'object' && body !== null) {
    const typed = body as { type?: string; items?: unknown };
    if (typed.type === 'List' && Array.isArray(typed.items)) return [...typed.items];
  }
  return [body];
}

function getParentRef(resource: { id: string; type?: string }): ParentRef {
  return {
    id: resource.id,
    type: resource.type || 'Annotation',
  };
}

function isSceneResource(value: unknown): value is SceneResource {
  return !!value && typeof value === 'object';
}

function toLanguageMap(value: unknown): InternationalString | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as InternationalString;
}

function isChoiceResource(resource: unknown): resource is ChoiceResource {
  if (!resource || typeof resource !== 'object') {
    return false;
  }
  const choice = resource as Partial<ChoiceResource>;
  return choice.type === 'Choice' && Array.isArray(choice.items);
}

export function createSceneHelper(vault: CompatVault = compatVault) {
  function getScene(sceneOrId: string | SceneNormalized | undefined | null): SceneLike | null {
    if (!sceneOrId) return null;
    if (typeof sceneOrId === 'string') {
      return vault.get<SceneLike>(sceneOrId) ?? null;
    }
    return sceneOrId;
  }

  function getPageItems(page: AnnotationPageLike): SceneAnnotation[] {
    if (!page.items) {
      return [];
    }
    const parent = getParentRef({ id: page.id, type: page.type || 'AnnotationPage' });
    return asArray(vault.get<SceneAnnotation>(page.items as never, { parent }));
  }

  function getAllPaintingAnnotations(sceneOrId: string | SceneNormalized | undefined | null): SceneAnnotation[] {
    const scene = getScene(sceneOrId);
    if (!scene) return [];

    const pages = asArray(vault.get<AnnotationPageLike>(scene.items as never, { parent: getParentRef(scene) }));
    const flat: SceneAnnotation[] = [];
    for (const page of pages) {
      for (const anno of getPageItems(page)) {
        if (anno) flat.push(anno);
      }
    }

    return flat.filter((anno) => getMotivations(anno).includes('painting'));
  }

  function getAllAnnotationPages(sceneOrId: string | SceneNormalized | undefined | null): AnnotationPageLike[] {
    const scene = getScene(sceneOrId);
    if (!scene) return [];
    if (!scene.annotations?.length) {
      return [];
    }
    return asArray(vault.get<AnnotationPageLike>(scene.annotations as never, { parent: getParentRef(scene) }));
  }

  function getAllAnnotations(sceneOrId: string | SceneNormalized | undefined | null): SceneAnnotation[] {
    const scene = getScene(sceneOrId);
    if (!scene) return [];

    const pages = [
      ...asArray(vault.get<AnnotationPageLike>(scene.items as never, { parent: getParentRef(scene) })),
      ...getAllAnnotationPages(scene),
    ];
    const flat: SceneAnnotation[] = [];
    for (const page of pages) {
      flat.push(...getPageItems(page));
    }
    return flat;
  }

  function getPaintables(sceneOrId: string | SceneNormalized, enabledChoices: string[] = []): ScenePaintables {
    const scene = getScene(sceneOrId);
    if (!scene) {
      throw new Error('getPaintables() requires a Scene');
    }

    const paintingAnnotations = getAllPaintingAnnotations(scene);
    const types: ScenePaintables['types'] = [];
    const rawTypes: string[] = [];
    const choices: ComplexChoice = { type: 'complex-choice', items: [] };
    const items: ScenePaintables['items'] = [];

    for (const annotation of paintingAnnotations) {
      const parent = getParentRef(annotation as { id: string; type?: string });
      const bodies = unwrapBodyList(annotation.body);

      for (const bodyEntry of bodies) {
        const hydratedBodyEntry = vault.get<SceneResource>(bodyEntry as never, { parent, skipSelfReturn: false });
        const parsed = parseSceneSpecificResource(hydratedBodyEntry ?? bodyEntry);
        const maybeChoice = vault.get<SceneResource>(parsed.source as never, { parent, skipSelfReturn: false });

        if (isChoiceResource(maybeChoice)) {
          const nestedBodies = asArray(
            vault.get<SceneResource>(maybeChoice.items as never, {
              parent: { id: maybeChoice.id || '', type: 'Choice' },
            })
          ).filter(isSceneResource);
          const selected = enabledChoices.length
            ? enabledChoices.map((cid) => nestedBodies.find((b) => b?.id === cid)).filter(isDefined)
            : [maybeChoice.default ? vault.get<SceneResource>(maybeChoice.default as never) : nestedBodies[0]].filter(
                isDefined
              );

          if (selected.length === 0 && nestedBodies[0]) {
            selected.push(nestedBodies[0]);
          }
          if (selected.length === 0) {
            continue;
          }

          choices.items.push({
            type: 'single-choice',
            items: nestedBodies.map((b) => ({
              id: b.id || '',
              label: toLanguageMap(b.label),
              selected: selected.indexOf(b) !== -1 ? true : undefined,
            })),
            label: toLanguageMap(maybeChoice.label),
          });

          bodies.push(...selected);
          continue;
        }

        const sources = asArray(parsed.source);
        for (const source of sources) {
          const resolved = vault.get<SceneResource>(source as never, { parent, skipSelfReturn: false });
          if (!resolved) {
            continue;
          }
          const { type, rawType } = normalizeScenePaintableType(resolved.type);
          const hydratedTarget = annotation.target
            ? vault.get<SceneResource>(annotation.target as never, {
                parent,
                skipSelfReturn: false,
                preserveSpecificResources: true,
              })
            : null;

          if (!types.includes(type)) {
            types.push(type);
          }
          if (!rawTypes.includes(rawType)) {
            rawTypes.push(rawType);
          }

          items.push({
            type,
            rawType,
            annotationId: annotation.id,
            annotation,
            resource: resolved,
            target: hydratedTarget
              ? expandTarget(hydratedTarget as Parameters<typeof expandTarget>[0], { defaultType: 'Scene' })
              : null,
            bodySelector: parsed.selector,
            bodyTransform: parsed.transform,
            bodyAction: parsed.action,
          });
        }
      }
    }

    return {
      scene,
      types,
      rawTypes,
      availableTypes: KNOWN_SCENE_PAINTABLE_TYPES,
      items,
      choice: choices.items.length < 2 ? choices.items[0] || null : choices,
      allChoices: choices.items.length ? choices : null,
    };
  }

  return {
    getAllPaintingAnnotations,
    getAllAnnotations,
    getPaintables,
  };
}
