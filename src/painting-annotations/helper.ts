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
        const [ref, { selector, styleClass }] = parseSpecificResource(reference as any);
        const body = vault.get(ref);
        const type = (body.type || 'unknown').toLowerCase();

        // Choice
        if (type === 'choice') {
          const nestedBodies = vault.get((body as any).items, {
            parent: (body as any).id,
          }) as ContentResource[];
          // Which are active? By default, the first, but we could push multiple here.
          const selected = enabledChoices.length
            ? enabledChoices.map((cid) => nestedBodies.find((b) => b.id === cid)).filter(Boolean)
            : [nestedBodies[0]];

          if (selected.length === 0) {
            selected.push(nestedBodies[0]);
          }

          // Store choice.
          choices.items.push({
            type: 'single-choice',
            items: nestedBodies.map((b) => ({
              id: b.id,
              label: (b as any).label as any,
              selected: selected.indexOf(b) !== -1,
            })) as any[],
            label: (ref as any).label,
          });

          // @todo insert in the right order.
          references.push(...(selected as any[]));

          continue;
        }

        if (types.indexOf(type) === -1) {
          types.push(type);
        }

        const loadedStylesheets = styleClass ? getInlineStylesheets(annotation.stylesheet) : undefined;
        const style = styleClass ? resolveSelectorStyle(styleClass, loadedStylesheets) : undefined;
        const transformAttributes = style ? getSelectorTransformAttributes(style) : {};

        items.push({
          type: type,
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
