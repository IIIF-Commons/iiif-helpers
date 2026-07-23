import { type CompatVault, compatVault } from '../compat';
import { parseSceneSpecificResource } from '../scenes/parse-specific-resource';
import type { SceneAnnotation, SceneResource } from '../scenes/types';
import type { ActivationTransaction } from './types';

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

type ActivationAnnotation = SceneAnnotation;
type AnnotationPageLike = { id: string; type?: string; items?: unknown };
type ParentRef = { id: string; type: string };

function unwrapBodyList(body: unknown): unknown[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (typeof body === 'object' && body !== null) {
    const typed = body as { type?: string; items?: unknown };
    if (typed.type === 'List' && Array.isArray(typed.items)) {
      return [...typed.items];
    }
  }
  return [body];
}

function getParentRef(resource: { id: string; type?: string }): ParentRef {
  return { id: resource.id, type: resource.type || 'Annotation' };
}

function getMotivations(annotation: ActivationAnnotation): string[] {
  const m = annotation?.motivation;
  return Array.isArray(m) ? [...m] : [];
}

export function createActivationsHelper(vault: CompatVault = compatVault) {
  function getAllActivatingAnnotations(
    containerOrId: string | { id: string; type?: string; items?: unknown; annotations?: unknown }
  ): ActivationAnnotation[] {
    const container =
      typeof containerOrId === 'string'
        ? vault.get<{ id: string; type?: string; items?: unknown; annotations?: unknown }>(containerOrId)
        : containerOrId;
    if (!container || typeof container !== 'object') return [];

    const containerParent = getParentRef(container);
    const pages: AnnotationPageLike[] = [];
    if (container.items) {
      pages.push(...asArray(vault.get<AnnotationPageLike>(container.items as never, { parent: containerParent })));
    }
    if (container.annotations) {
      pages.push(
        ...asArray(vault.get<AnnotationPageLike>(container.annotations as never, { parent: containerParent }))
      );
    }

    const flat: ActivationAnnotation[] = [];
    for (const page of pages) {
      if (!page) continue;
      const items = asArray(
        vault.get<ActivationAnnotation>(page.items as never, {
          parent: getParentRef({ id: page.id, type: page.type || 'AnnotationPage' }),
        })
      );
      flat.push(...items);
    }

    return flat.filter((anno) => getMotivations(anno).includes('activating'));
  }

  function parseActivatingAnnotation(annotationOrId: string | ActivationAnnotation): ActivationTransaction | null {
    const annotation =
      typeof annotationOrId === 'string' ? vault.get<ActivationAnnotation>(annotationOrId) : annotationOrId;
    if (!annotation || typeof annotation !== 'object') return null;
    if (!getMotivations(annotation).includes('activating')) return null;

    const parent = getParentRef(annotation as { id: string; type?: string });
    const bodies = unwrapBodyList(annotation.body);
    const steps: ActivationTransaction['steps'] = [];

    for (const bodyEntry of bodies) {
      const hydratedBody = vault.get<SceneResource>(bodyEntry as never, { parent, skipSelfReturn: false });
      const parsed = parseSceneSpecificResource(hydratedBody ?? bodyEntry);
      const sources = asArray(parsed.source);
      for (const source of sources) {
        const resolved = vault.get<SceneResource>(source as never, { parent });
        steps.push({
          source: resolved,
          sourceRef: source,
          selector: parsed.selector,
          transform: parsed.transform,
          actions: parsed.action,
        });
      }
    }

    return {
      annotationId: annotation.id,
      annotation,
      steps,
    };
  }

  return {
    getAllActivatingAnnotations,
    parseActivatingAnnotation,
  };
}
