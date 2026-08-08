import type { Selector, Transform } from '@iiif/parser/presentation-4/types';
import { resolveAnnotationValues } from '../annotation-values';
import { type CompatVault, compatVault } from '../compat';
import type { SceneAnnotation, SceneRenderableResource } from '../scenes/types';
import type { ActivationStep, ActivationTransaction } from './types';

type Container = { id: string; type?: string; items?: unknown; annotations?: unknown };
type AnnotationPage = { id: string; type?: string; items?: unknown };
type ParentRef = { id: string; type: string };

const asArray = <T>(value: T | readonly T[] | null | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? [...value] : [value as T];
const parent = (value: { id: string; type?: string }): ParentRef => ({
  id: value.id,
  type: value.type || 'Annotation',
});
const strings = (value: unknown) =>
  asArray(value as string | readonly string[]).filter((item): item is string => typeof item === 'string');
const motivations = (annotation: SceneAnnotation) => strings(annotation.motivation);

function values<T>(wrappers: unknown[], key: string): T[] {
  return wrappers.flatMap((wrapper) => asArray((wrapper as Record<string, unknown>)?.[key] as T | readonly T[]));
}

function refId(value: unknown): string | null {
  if (typeof value === 'string') return value.split('#')[0];
  if (value && typeof value === 'object') {
    const object = value as { id?: unknown; type?: unknown; source?: unknown };
    if (typeof object.id === 'string' && object.type !== 'SpecificResource') return object.id.split('#')[0];
    if (object.source) return refId(object.source);
  }
  return null;
}

export function createActivationsHelper(vault: CompatVault = compatVault) {
  function resolve<T>(
    value: unknown,
    container?: { id: string; type?: string },
    preserveSpecificResources = false
  ): T | null {
    return (vault.get as any)(value as never, {
      ...(container ? { parent: parent(container) } : {}),
      skipSelfReturn: false,
      preserveSpecificResources,
    }) as T | null;
  }

  function getContainerAnnotations(containerOrId: string | Container): SceneAnnotation[] {
    const root = typeof containerOrId === 'string' ? resolve<Container>(containerOrId) : containerOrId;
    if (!root) return [];
    const found: SceneAnnotation[] = [];
    const seen = new Set<string>();

    const visit = (node: Container | AnnotationPage) => {
      if (!node?.id || seen.has(node.id)) return;
      seen.add(node.id);
      if (node.type === 'AnnotationPage') {
        found.push(...asArray(resolve<SceneAnnotation>(node.items, node)));
        return;
      }
      for (const entry of [...asArray(node.items), ...asArray((node as Container).annotations)]) {
        const child = resolve<Container | AnnotationPage>(entry, node);
        if (
          child &&
          ['AnnotationPage', 'Canvas', 'Timeline', 'Scene', 'Manifest'].includes(child.type || '')
        )
          visit(child);
      }
    };
    visit(root);
    return found;
  }

  function hydrateAggregate(value: unknown, container: { id: string; type?: string }): unknown {
    const hydrated = resolve<any>(value, container, true) ?? value;
    if (
      hydrated &&
      typeof hydrated === 'object' &&
      ['Choice', 'Composite', 'List', 'Independents'].includes(hydrated.type) &&
      Array.isArray(hydrated.items)
    ) {
      return { ...hydrated, items: hydrated.items.map((item: unknown) => hydrateAggregate(item, hydrated)) };
    }
    return hydrated;
  }

  function getAllActivatingAnnotations(containerOrId: string | Container): SceneAnnotation[] {
    return getContainerAnnotations(containerOrId).filter((annotation) =>
      motivations(annotation).includes('activating')
    );
  }

  function triggerIds(annotation: SceneAnnotation): string[] {
    const hydrated = resolve<unknown>(annotation.target, annotation, true) ?? annotation.target;
    const ids = resolveAnnotationValues(hydrated)
      .map(({ value, specificResources }) => {
        return refId(specificResources.at(-1)) || refId(value);
      })
      .filter((id): id is string => !!id);
    return [...new Set(ids)];
  }

  function sourceStep(
    sourceRef: unknown,
    wrappers: unknown[],
    aggregatePath: ActivationStep['aggregatePath'],
    fallbackActions: readonly string[] = []
  ): ActivationStep {
    const selectorValues = values<Selector>(wrappers, 'selector');
    const transformValues = values<Transform>(wrappers, 'transform');
    const actions = values<unknown>(wrappers, 'action').filter((value): value is string => typeof value === 'string');
    return {
      source: resolve<SceneRenderableResource>(sourceRef),
      sourceRef,
      selector: selectorValues.length === 1 ? selectorValues[0] : selectorValues.length ? selectorValues : null,
      transform: transformValues,
      actions: actions.length ? actions : fallbackActions,
      aggregatePath,
    };
  }

  function parseActivatingAnnotation(annotationOrId: string | SceneAnnotation): ActivationTransaction | null {
    const annotation = typeof annotationOrId === 'string' ? resolve<SceneAnnotation>(annotationOrId) : annotationOrId;
    if (!annotation) return null;
    const activating = motivations(annotation).includes('activating');
    const scope = asArray(annotation.scope);
    if (!activating && !scope.length) return null;

    const steps: ActivationStep[] = [];
    if (activating && annotation.body) {
      const body = hydrateAggregate(annotation.body, annotation);
      for (const entry of resolveAnnotationValues(body)) {
        steps.push(sourceStep(entry.value, entry.specificResources, entry.aggregatePath));
        for (const scoped of values<unknown>(entry.specificResources, 'scope')) {
          steps.push(sourceStep(scoped, [], entry.aggregatePath, ['show', 'enable', 'select']));
        }
      }
    }
    for (const scoped of scope) steps.push(sourceStep(scoped, [], [], ['show', 'enable', 'select']));

    return { annotationId: annotation.id, annotation, triggerIds: triggerIds(annotation), steps };
  }

  function getActivationsForTarget(containerOrId: string | Container, targetId: string): ActivationTransaction[] {
    const transactions: ActivationTransaction[] = [];
    for (const annotation of getContainerAnnotations(containerOrId)) {
      if (!motivations(annotation).includes('activating') && !asArray(annotation.scope).length) continue;
      const parsed = parseActivatingAnnotation(annotation);
      if (!parsed) continue;
      if (parsed.triggerIds.includes(targetId) || annotation.id === targetId) transactions.push(parsed);
    }
    return transactions;
  }

  return { getAllActivatingAnnotations, getActivationsForTarget, parseActivatingAnnotation };
}
