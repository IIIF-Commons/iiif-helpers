import type {
  ContentResource as ContentResourceV3,
  IIIFExternalWebResource as IIIFExternalWebResourceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV3,
  CanvasNormalized as CanvasNormalizedV3,
} from '@iiif/parser/presentation-3-normalized/types';
import type {
  ContentResource as ContentResourceV4,
  ContentResourceLike as IIIFExternalWebResourceV4,
} from '@iiif/parser/presentation-4/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV4,
  CanvasNormalized as CanvasNormalizedV4,
} from '@iiif/parser/presentation-4-normalized/types';
import { resolveAnnotationValues } from '../annotation-values';
import { type CompatVault, compatVault } from '../compat';
import { parseSpecificResource } from './parse-specific-resource';
import { getSelectorTransformAttributes, resolveSelectorStyle } from '../annotation-targets/css-selectors';
import type { ComplexChoice, Paintables } from './types';

type CanvasNormalized = CanvasNormalizedV3 | CanvasNormalizedV4;
type AnnotationNormalized = AnnotationNormalizedV3 | AnnotationNormalizedV4;
type ContentResource = ContentResourceV3 | ContentResourceV4;
type IIIFExternalWebResource = IIIFExternalWebResourceV3 | IIIFExternalWebResourceV4;

function getInlineStylesheets(stylesheet: AnnotationNormalized['stylesheet']): Record<string, string> | undefined {
  if (!stylesheet) {
    return undefined;
  }

  const stylesheets = Array.isArray(stylesheet) ? stylesheet : [stylesheet];
  const result: Record<string, string> = {};

  for (const sheet of stylesheets as any[]) {
    if (sheet?.type !== 'CssStylesheet' || !('value' in sheet)) {
      continue;
    }
    const value = Array.isArray(sheet.value) ? sheet.value.join('\n') : sheet.value;
    if (value) {
      result[sheet.id || `inline-${Object.keys(result).length}`] = value;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

export function createPaintingAnnotationsHelper(vault: CompatVault = compatVault) {
  function getAllPaintingAnnotations(canvasOrId: string | CanvasNormalized | undefined | null) {
    const canvas = canvasOrId
      ? typeof canvasOrId === 'string'
        ? vault.get<CanvasNormalized>(canvasOrId)
        : canvasOrId
      : null;

    if (!canvas) {
      return [];
    }
    const annotationPages = vault.get(canvas.items as any, { parent: canvas }) as any[];
    const flatAnnotations: AnnotationNormalized[] = [];
    for (const page of annotationPages) {
      flatAnnotations.push(...(vault.get(page.items as any, { parent: page }) as any[]));
    }
    return flatAnnotations;
  }

  function getPaintables(
    paintingAnnotationsOrCanvas: string | CanvasNormalized | AnnotationNormalized[],
    enabledChoices: string[] = []
  ): Paintables {
    const paintingAnnotations = Array.isArray(paintingAnnotationsOrCanvas)
      ? paintingAnnotationsOrCanvas
      : getAllPaintingAnnotations(paintingAnnotationsOrCanvas);

    const types: string[] = [];
    const choices: ComplexChoice = {
      items: [],
      type: 'complex-choice',
    };
    const items: Paintables['items'] = [];

    for (const annotation of paintingAnnotations) {
      if (annotation.type !== 'Annotation') {
        throw new Error(`getPaintables() accept either a canvas or list of annotations`);
      }

      const references = Array.from(Array.isArray(annotation.body) ? annotation.body : [annotation.body]);
      for (const reference of references) {
        const [ref, { selector: outerSelector, styleClass: outerStyleClass }] = parseSpecificResource(
          reference as any
        );
        const aggregate = vault.get(ref);
        const resolved = resolveAnnotationValues(aggregate);
        const bodies = resolved.map((entry) => ({
          ...entry,
          body: vault.get(entry.value as any, { skipSelfReturn: false }) as ContentResource,
        }));
        const enabled = new Set(enabledChoices);
        const choiceGroups = new Map<string, { pathIndex: number; bodies: typeof bodies }>();
        for (const candidate of bodies) {
          candidate.aggregatePath.forEach((step, pathIndex) => {
            if (step.type !== 'Choice') return;
            const key = JSON.stringify(candidate.aggregatePath.slice(0, pathIndex));
            const group = choiceGroups.get(key) || { pathIndex, bodies: [] };
            group.bodies.push(candidate);
            choiceGroups.set(key, group);
          });
        }
        const selectedChoiceIndexes = new Map<string, Set<number>>();

        for (const [key, group] of choiceGroups) {
          const selected = new Set(
            group.bodies
              .filter(({ body }) => !!body.id && enabled.has(body.id))
              .map(({ aggregatePath }) => aggregatePath[group.pathIndex].index)
          );
          if (!selected.size) {
            selected.add(group.bodies[0].aggregatePath[group.pathIndex].index);
          }
          selectedChoiceIndexes.set(key, selected);
          choices.items.push({
            type: 'single-choice',
            items: group.bodies.map(({ body, aggregatePath }) => ({
              id: body.id,
              label: (body as any).label as any,
              selected: selected.has(aggregatePath[group.pathIndex].index),
            })) as any[],
            label: group.pathIndex === 0 ? (aggregate as any).label || (ref as any).label : undefined,
          });
        }

        for (const { body, aggregatePath, specificResources } of bodies) {
          const isSelected = aggregatePath.every((step, pathIndex) => {
            if (step.type !== 'Choice') return true;
            const key = JSON.stringify(aggregatePath.slice(0, pathIndex));
            return selectedChoiceIndexes.get(key)?.has(step.index);
          });
          if (!isSelected) {
            continue;
          }

          const type = (body.type || 'unknown').toLowerCase();
          if (types.indexOf(type) === -1) {
            types.push(type);
          }

          const specificResource = specificResources.find(
            (candidate: any) => candidate.selector || candidate.styleClass
          ) as any;
          const selector = outerSelector || specificResource?.selector || null;
          const styleClass = outerStyleClass || specificResource?.styleClass;
          const loadedStylesheets = styleClass ? getInlineStylesheets(annotation.stylesheet) : undefined;
          const style = styleClass ? resolveSelectorStyle(styleClass, loadedStylesheets) : undefined;
          const transformAttributes = style ? getSelectorTransformAttributes(style) : {};

          items.push({
            type,
            annotationId: annotation.id,
            annotation: annotation as any,
            resource: body as IIIFExternalWebResource,
            target: annotation.target,
            selector,
            ...(styleClass ? { styleClass } : {}),
            ...(style && Object.keys(style).length ? { style } : {}),
            ...transformAttributes,
          });
        }
      }
    }

    return {
      types,
      items,
      choice: choices.items.length < 2 ? choices.items[0] || null : choices,
      allChoices: choices.items.length ? choices : null,
    };
  }

  function extractChoices(paintingAnnotationsOrCanvas: string | CanvasNormalized | AnnotationNormalized[]) {
    const { choice } = getPaintables(paintingAnnotationsOrCanvas);
    return choice;
  }

  return {
    getAllPaintingAnnotations,
    getPaintables,
    extractChoices,
  };
}
