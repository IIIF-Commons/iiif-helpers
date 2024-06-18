import { ContentResource, IIIFExternalWebResource } from '@iiif/presentation-3';
import { AnnotationNormalized, CanvasNormalized } from '@iiif/presentation-3-normalized';
import { ComplexChoice, Paintables } from './types';
import { parseSpecificResource } from './parse-specific-resource';
import { compatVault, CompatVault } from '../compat';

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
    const annotationPages = vault.get(canvas.items, { parent: canvas });
    const flatAnnotations: AnnotationNormalized[] = [];
    for (const page of annotationPages) {
      flatAnnotations.push(...vault.get(page.items, { parent: page }));
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
    let choices: ComplexChoice = {
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
        const [ref, { selector }] = parseSpecificResource(reference as any);
        const body = vault.get(ref);
        const type = (body.type || 'unknown').toLowerCase();

        // Choice
        if (type === 'choice') {
          const nestedBodies = vault.get((body as any).items, { parent: (body as any).id }) as ContentResource[];
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

        items.push({
          type: type,
          annotationId: annotation.id,
          resource: body as IIIFExternalWebResource,
          target: annotation.target,
          selector,
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
