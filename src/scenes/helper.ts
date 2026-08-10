import type { InternationalString } from "@iiif/parser/presentation-3/types";
import type { Selector, Transform } from "@iiif/parser/presentation-4/types";
import type { SceneNormalized } from "@iiif/parser/presentation-4-normalized/types";
import { resolveAnnotationValues, type AnnotationAggregateStep } from "../annotation-values";
import { type CompatVault, compatVault } from "../compat";
import type { ComplexChoice } from "../painting-annotations/types";
import { parseSceneTarget, type SelectorChain } from "./target";
import {
  KNOWN_SCENE_PAINTABLE_TYPES,
  normalizeScenePaintableType,
  type SceneAnnotation,
  type ScenePaintables,
  type SceneRenderableResource,
} from "./types";

type SceneLike = SceneNormalized & { annotations?: readonly { id: string; type: string }[] };
type AnnotationPageLike = { id: string; type?: string; items?: unknown };
type ParentRef = { id: string; type: string };

const asArray = <T>(value: T | readonly T[] | null | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? [...value] : [value as T];
const parent = (resource: { id: string; type?: string }): ParentRef => ({
  id: resource.id,
  type: resource.type || "Annotation",
});
const motivations = (annotation: SceneAnnotation) => asArray(annotation.motivation);
const strings = (value: unknown): string[] =>
  asArray(value as string | readonly string[]).filter((item): item is string => typeof item === "string");

function selectorChain(selector: Selector | readonly Selector[] | undefined): SelectorChain | null {
  const first = asArray(selector)[0];
  if (!first) return null;
  const chain: Selector[] = [];
  let current: Selector | undefined = first;
  const seen = new Set<object>();
  while (current && !seen.has(current as object)) {
    seen.add(current as object);
    chain.push(current);
    current = (current as Selector & { refinedBy?: Selector }).refinedBy;
  }
  return chain;
}

function wrapperValues<T>(wrappers: unknown[], key: string): T[] {
  return wrappers.flatMap((wrapper) => {
    const value = (wrapper as Record<string, unknown>)?.[key];
    return asArray(value as T | readonly T[]);
  });
}

function choiceKey(
  annotationId: string,
  rootIndex: number,
  path: readonly AnnotationAggregateStep[],
  choiceIndex: number
) {
  return JSON.stringify([annotationId, rootIndex, ...path.slice(0, choiceIndex)]);
}

function languageMap(value: unknown): InternationalString | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as InternationalString) : undefined;
}

export function createSceneHelper(vault: CompatVault = compatVault) {
  function getScene(sceneOrId: string | SceneNormalized | null | undefined): SceneLike | null {
    if (!sceneOrId) return null;
    return typeof sceneOrId === "string" ? (vault.get<SceneLike>(sceneOrId) ?? null) : sceneOrId;
  }

  function getPageItems(page: AnnotationPageLike): SceneAnnotation[] {
    return asArray(
      (vault.get as any)(page.items as never, {
        parent: parent({ id: page.id, type: page.type || "AnnotationPage" }),
      })
    ) as SceneAnnotation[];
  }

  function getPages(sceneOrId: string | SceneNormalized | null | undefined, property: "items" | "annotations") {
    const scene = getScene(sceneOrId);
    if (!scene) return [];
    return asArray(vault.get<AnnotationPageLike>(scene[property] as never, { parent: parent(scene) }));
  }

  function getAllPaintingAnnotations(sceneOrId: string | SceneNormalized | null | undefined) {
    return getPages(sceneOrId, "items")
      .flatMap(getPageItems)
      .filter((annotation) => motivations(annotation).includes("painting"));
  }

  function getAllAnnotationPages(sceneOrId: string | SceneNormalized | null | undefined) {
    return getPages(sceneOrId, "annotations");
  }

  function getAllAnnotations(sceneOrId: string | SceneNormalized | null | undefined) {
    return [...getPages(sceneOrId, "items"), ...getAllAnnotationPages(sceneOrId)].flatMap(getPageItems);
  }

  function getPaintables(sceneOrId: string | SceneNormalized, enabledChoices: string[] = []): ScenePaintables {
    const scene = getScene(sceneOrId);
    if (!scene) throw new Error("getPaintables() requires a Scene");

    const candidates: Array<{
      annotation: SceneAnnotation;
      resource: SceneRenderableResource;
      wrappers: unknown[];
      aggregatePath: AnnotationAggregateStep[];
      aggregateDefaults: Array<number | undefined>;
      rootIndex: number;
    }> = [];
    const choices: ComplexChoice = { type: "complex-choice", items: [] };
    const enabled = new Set(enabledChoices);

    for (const annotation of getAllPaintingAnnotations(scene)) {
      const annotationParent = parent(annotation);
      const body =
        (vault.get as any)(annotation.body as never, {
          parent: annotationParent,
          skipSelfReturn: false,
          preserveSpecificResources: true,
        }) ?? annotation.body;
      for (const [rootIndex, rootBody] of asArray(body).entries()) {
        for (const resolved of resolveAnnotationValues(
          rootBody,
          (value) =>
            (vault.get as any)(value as never, {
              parent: annotationParent,
              preserveSpecificResources: true,
            }) ?? value
        )) {
          const resource = vault.get<SceneRenderableResource>(resolved.value as never, {
            parent: annotationParent,
            skipSelfReturn: false,
          });
          if (resource?.id && resource.type) {
            candidates.push({
              annotation,
              resource,
              wrappers: resolved.specificResources,
              aggregatePath: resolved.aggregatePath,
              aggregateDefaults: resolved.aggregateDefaults,
              rootIndex,
            });
          }
        }
      }
    }

    const choiceGroups = new Map<string, { pathIndex: number; candidates: typeof candidates }>();
    for (const candidate of candidates) {
      candidate.aggregatePath.forEach((step, pathIndex) => {
        if (step.type !== "Choice") return;
        const key = choiceKey(candidate.annotation.id, candidate.rootIndex, candidate.aggregatePath, pathIndex);
        const group = choiceGroups.get(key) || { pathIndex, candidates: [] };
        group.candidates.push(candidate);
        choiceGroups.set(key, group);
      });
    }
    const selectedChoices = new Map<string, Set<number>>();
    for (const [key, group] of choiceGroups) {
      const selected = new Set(
        group.candidates
          .filter(({ resource }) => enabled.has(resource.id))
          .map(({ aggregatePath }) => aggregatePath[group.pathIndex].index)
      );
      if (!selected.size) {
        const candidate = group.candidates[0];
        if (candidate) {
          selected.add(candidate.aggregateDefaults[group.pathIndex] ?? candidate.aggregatePath[group.pathIndex].index);
        }
      }
      selectedChoices.set(key, selected);
      choices.items.push({
        type: "single-choice",
        items: group.candidates.map(({ resource, aggregatePath }) => ({
          id: resource.id,
          label: languageMap(resource.label),
          selected: selected.has(aggregatePath[group.pathIndex].index) ? true : undefined,
        })),
      });
    }

    const items: ScenePaintables["items"] = [];
    const types: ScenePaintables["types"] = [];
    const rawTypes: string[] = [];
    for (const candidate of candidates) {
      if (
        !candidate.aggregatePath.every(
          (step, pathIndex) =>
            step.type !== "Choice" ||
            selectedChoices
              .get(choiceKey(candidate.annotation.id, candidate.rootIndex, candidate.aggregatePath, pathIndex))
              ?.has(step.index)
        )
      )
        continue;
      const { annotation, resource, wrappers, aggregatePath } = candidate;
      const normalized = normalizeScenePaintableType(resource.type);
      const hydratedTarget =
        (vault.get as any)(annotation.target as never, {
          parent: parent(annotation),
          skipSelfReturn: false,
          preserveSpecificResources: true,
        }) ?? annotation.target;
      const transforms = wrapperValues<Transform>(wrappers, "transform");
      const selectors = wrapperValues<Selector>(wrappers, "selector");
      const actions = wrapperValues<unknown>(wrappers, "action").filter(
        (action): action is string => typeof action === "string"
      );
      if (!types.includes(normalized.type)) types.push(normalized.type);
      if (!rawTypes.includes(normalized.rawType)) rawTypes.push(normalized.rawType);
      items.push({
        ...normalized,
        annotationId: annotation.id,
        annotation,
        resource,
        target: parseSceneTarget(hydratedTarget, { id: scene.id, type: "Scene" }),
        bodySelector: selectorChain(selectors.length ? selectors : resource.selector),
        bodyTransform: transforms.length ? transforms : asArray(resource.transform as Transform | readonly Transform[]),
        bodyAction: actions.length ? actions : strings(resource.action),
        behavior: [...strings(annotation.behavior), ...strings(resource.behavior)],
        exclude: asArray(annotation.exclude),
        timeMode: typeof annotation.timeMode === "string" ? annotation.timeMode : "trim",
        aggregatePath,
      });
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

  return { getAllPaintingAnnotations, getAllAnnotationPages, getAllAnnotations, getPaintables };
}
