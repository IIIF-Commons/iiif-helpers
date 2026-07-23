// Transcription helper.
// Will find the following transcriptions:
//
// - VTT as rendering on canvas
// - Embedded Annotation page
// - External Annotation page
// - ALTO annotations
//
// Helpers:
// - canvasHasTranscription() -> boolean
// - getCanvasTranscription() -> { TBC }
//
// Cookbook:
// - https://iiif.io/api/cookbook/recipe/0017-transcription-av/
// - https://iiif.io/api/cookbook/recipe/0219-using-caption-file/
// - https://iiif.io/api/cookbook/recipe/0046-rendering/
// - https://iiif.io/api/cookbook/recipe/0231-transcript-meta-recipe/
// - https://iiif.io/api/cookbook/recipe/0068-newspaper/
//
// Plaintext rendering on canvas:
//   "rendering": [
//   {
//     "id": "https://fixtures.iiif.io/video/indiana/volleyball/volleyball.txt",
//     "type": "Text",
//     "label": {
//       "en": [
//         "Transcript"
//       ]
//     },
//     "format": "text/plain"
//   }
// ]
//
//
// VTT annotation body on AV canvases:
// "annotations": [
//   {
//     "id": "https://iiif.io/api/cookbook/recipe/0219-using-caption-file/canvas/page2",
//     "type": "AnnotationPage",
//     "items": [
//       {
//         "id": "https://iiif.io/api/cookbook/recipe/0219-using-caption-file/canvas/page2/a1",
//         "type": "Annotation",
//         "motivation": "supplementing",
//         "body": {
//           "id": "https://fixtures.iiif.io/video/indiana/lunchroom_manners/lunchroom_manners.vtt",
//           "type": "Text",
//           "format": "text/vtt",
//           "label": {
//             "en": [
//               "Captions in WebVTT format"
//             ]
//           },
//           "language": "en"
//         },
//         "target": "https://iiif.io/api/cookbook/recipe/0219-using-caption-file/canvas"
//       }
//     ]
//   }
// ]
//
//
//
// OCR annotations:
// - a motivation of supplementing,
// - the URI of the OCR file in the id property of the Annotation body, and
// - the target set to the applicable Canvas.
// {
//   "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/newspaper_issue_1-anno_p1.json-1",
//   "type": "Annotation",
//   "motivation": "supplementing",
//   "body": {
//     "type": "TextualBody",
//     "format": "text/plain",
//     "language": "de",
//     "value": "I. 54. Jahrgang"
//   },
//   "target": {
//     "type": "SpecificResource",
//     "source": {
//       "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/canvas/p1",
//       "type": "Canvas",
//       "partOf": [
//         {
//           "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/newspaper_issue_1-manifest.json",
//           "type": "Manifest"
//         }
//       ]
//     },
//     "selector": {
//       "type": "FragmentSelector",
//       "conformsTo": "http://www.w3.org/TR/media-frags/",
//       "value": "xywh=0,376,399,53"
//     }
//   }
// }
// OR
// Linking Directly to an ALTO File.
//  "rendering": [
//   {
//     "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/newspaper_issue_1-alto_p2.xml",
//     "type": "Text",
//     "format": "application/xml",
//     "profile": "http://www.loc.gov/standards/alto/",
//     "label": {
//       "en": [
//         "ALTO XML"
//       ]
//     }
//   }
// ],

import type {
  AnnotationPage as AnnotationPageV3,
  Annotation as AnnotationV3,
  Canvas as CanvasV3,
  ContentResource as ContentResourceV3,
  Manifest as ManifestV3,
} from '@iiif/parser/presentation-3/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV3,
  AnnotationPageNormalized as AnnotationPageNormalizedV3,
  CanvasNormalized as CanvasNormalizedV3,
  ManifestNormalized as ManifestNormalizedV3,
} from '@iiif/parser/presentation-3-normalized/types';
import type {
  AnnotationPage as AnnotationPageV4,
  Annotation as AnnotationV4,
  Canvas as CanvasV4,
  ContentResource as ContentResourceV4,
  Manifest as ManifestV4,
  Scene as SceneV4,
  Timeline as TimelineV4,
} from '@iiif/parser/presentation-4/types';
import type {
  AnnotationNormalized as AnnotationNormalizedV4,
  AnnotationPageNormalized as AnnotationPageNormalizedV4,
  CanvasNormalized as CanvasNormalizedV4,
  ManifestNormalized as ManifestNormalizedV4,
  SceneNormalized as SceneNormalizedV4,
  TimelineNormalized as TimelineNormalizedV4,
} from '@iiif/parser/presentation-4-normalized/types';
import { resolveAnnotationValues } from './annotation-values';
import { expandTarget, type ParsedSelector, parseSelector, type TemporalSelector } from './annotation-targets';
import type { CompatVault } from './compat';

type Annotation = AnnotationV3 | AnnotationV4 | AnnotationNormalizedV3 | AnnotationNormalizedV4;
type AnnotationPage = AnnotationPageV3 | AnnotationPageV4 | AnnotationPageNormalizedV3 | AnnotationPageNormalizedV4;
type Canvas = CanvasV3 | CanvasV4 | CanvasNormalizedV3 | CanvasNormalizedV4;
type Container = Canvas | SceneV4 | TimelineV4 | SceneNormalizedV4 | TimelineNormalizedV4;
type ContentResource = ContentResourceV3 | ContentResourceV4;
type Manifest = ManifestV3 | ManifestV4 | ManifestNormalizedV3 | ManifestNormalizedV4;

function getAnnotationBodies(vault: CompatVault, body: unknown): any[] {
  return resolveAnnotationValues(vault.get(body as any))
    .filter(({ aggregatePath }) => aggregatePath.every(({ type, index }) => type !== 'Choice' || index === 0))
    .map(({ value }) => vault.get<ContentResource>(value as any, { skipSelfReturn: false }))
    .filter(Boolean);
}

interface Transcription {
  id: string;
  source: any;
  plaintext: string;
  segments: Array<{
    text: string;
    textRaw: string;
    granularity?: 'word' | 'line' | 'paragraph' | 'block' | 'page';
    language?: string;
    selector?: ParsedSelector;
    startRaw?: string;
    endRaw?: string;
  }>;
}

export function containerHasTranscriptionSync(
  vault: CompatVault,
  containerRef: Container | string,
  annotationPages?: AnnotationPage[]
): boolean {
  if (typeof containerRef === 'string') containerRef = { id: containerRef, type: 'Canvas' };
  const container = vault.get<Container>(containerRef);

  // Check for rendering
  if (container.rendering) {
    for (const renderingRef of container.rendering) {
      const rendering = vault.get<ContentResource>(renderingRef as any);
      if ('format' in rendering) {
        if (rendering.format === 'text/plain') return true;
        if (rendering.format === 'application/xml' && rendering?.profile === 'http://www.loc.gov/standards/alto/')
          return true;
      }
    }
  }

  // Check for annotations
  if (container.annotations) {
    for (const annotationPageRef of container.annotations) {
      const annotationPage = vault.get<AnnotationPage>(annotationPageRef);
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            for (const body of getAnnotationBodies(vault, annotation.body)) {
              if (body.format === 'text/vtt') return true;
              if (body.format === 'text/plain') return true;
              if (body.type === 'TextualBody') return true;
            }
          }
        }
      }
    }
  }

  // Check for external annotations passed in.
  if (annotationPages) {
    for (const annotationPage of annotationPages) {
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            for (const body of getAnnotationBodies(vault, annotation.body)) {
              if (body.format === 'text/vtt') return true;
              if (body.format === 'text/plain') return true;
              if (body.type === 'TextualBody') return true;
            }
          }
        }
      }
    }
  }

  return false;
}

export async function canvasLoadExternalAnnotationPages(
  vault: CompatVault,
  canvasRef: Canvas | string
): Promise<AnnotationPage[]> {
  return containerLoadExternalAnnotationPages(vault, canvasRef);
}

export async function containerLoadExternalAnnotationPages(
  vault: CompatVault,
  containerRef: Container | string
): Promise<AnnotationPage[]> {
  if (typeof containerRef === 'string') containerRef = { id: containerRef, type: 'Canvas' };
  const container = vault.get<Container>(containerRef);
  const promises: Promise<AnnotationPage>[] = [];
  if (container.annotations) {
    for (const annotationPageRef of container.annotations) {
      let annotationPage = vault.get<AnnotationPage>(annotationPageRef);
      const requestStatus = annotationPage ? vault.requestStatus(annotationPage.id) : undefined;

      if (annotationPage && requestStatus?.resourceUri && requestStatus.resourceUri !== annotationPage.id) {
        const resolvedAnnotationPage = vault.get<AnnotationPage>({
          id: requestStatus.resourceUri,
          type: annotationPage.type,
        });
        if (resolvedAnnotationPage) {
          annotationPage = resolvedAnnotationPage;
        }
      }

      if (!annotationPage.items || (annotationPage as any)['iiif-parser:isExternal']) {
        if (requestStatus) {
          promises.push(
            new Promise((resolve, reject) => {
              const cleanup = vault.subscribe(() => {
                const loadingState = vault.requestStatus(annotationPage.id)?.loadingState;
                if (loadingState === 'RESOURCE_ERROR') {
                  reject(new Error(`Failed to load annotation page ${annotationPage.id}`));
                  cleanup();
                }
                if (loadingState === 'RESOURCE_READY') {
                  resolve(annotationPage);
                  cleanup();
                }
              });
            })
          );
        } else {
          try {
            promises.push(vault.load<AnnotationPage>(annotationPage.id) as any);
          } catch (e) {
            // ignore.
          }
        }
      } else {
        promises.push(Promise.resolve(annotationPage));
      }
    }
  }

  return (await Promise.all(promises)).filter(Boolean);
}

export const canvasHasTranscriptionSync = containerHasTranscriptionSync;

// Credit: https://gist.github.com/brospars/0bd13de8a22530c87d0945cf8e611225
const vttRegex = /^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s-->\s(\d{2}:\d{2}:\d{2}[.,]\d{3})(.*)\r?\n(.*(?:\r?\n(?!\r?\n).*)*)/gm;

export function timeStampToSeconds(time: string) {
  const [hours, minutes, seconds] = time.split(':').map((t) => parseFloat(t || '0'));
  return hours * 3600 + minutes * 60 + seconds;
}

export async function vttToTranscription(vtt: string, id: string): Promise<Transcription | null> {
  const segments: Transcription['segments'] = [];

  // Reset lastIndex to avoid race conditions with the global regex
  vttRegex.lastIndex = 0;

  let match;
  while ((match = vttRegex.exec(vtt))) {
    const start = match[1];
    const end = match[2];
    const text = match[4].trim();

    // @todo support more VTT including styles and positioning.
    const selector: TemporalSelector = {
      type: 'TemporalSelector',
      temporal: {
        startTime: timeStampToSeconds(start),
        endTime: timeStampToSeconds(end),
      },
    };

    segments.push({
      startRaw: start,
      endRaw: end,
      text: text.replace(/(<([^>]+)>)/gi, ''),
      textRaw: text,
      selector: {
        selector,
        selectors: [selector],
      },
    });
  }

  if (!segments.length) return null;

  return {
    id,
    source: { id, type: 'Text', format: 'text/vtt' },
    plaintext: segments.map((s) => s.text).join('\n'),
    segments,
  };
}

async function altoToTranscription(alto: string) {
  // @todo.
  return null;
}

export async function annotationPageToTranscription(vault: CompatVault, annotationPage: AnnotationPage) {
  const transcription: Transcription = {
    id: annotationPage.id,
    source: { id: annotationPage.id, type: 'AnnotationPage' },
    plaintext: '',
    segments: [],
  };

  if (!annotationPage.items) return null;

  for (const annotationRef of annotationPage.items) {
    const annotation = vault.get<Annotation>(annotationRef as any);

    if (annotation.motivation?.includes('supplementing')) {
      if (annotation.body) {
        // @todo smarter ordering based on position?
        for (const body of getAnnotationBodies(vault, annotation.body)) {
          if ((body.format === 'text/plain' || body.type === 'TextualBody') && typeof body.value === 'string') {
            let segmentText = body.value;
            let granularity = (annotation as any).textGranularity;
            if (!granularity) {
              granularity = segmentText.includes(' ') ? 'line' : 'word';
            }
            if (
              granularity === 'line' ||
              granularity === 'paragraph' ||
              granularity === 'block' ||
              granularity === 'page'
            ) {
              segmentText += '\n';
            } else {
              segmentText += ' ';
            }

            const segment: Transcription['segments'][number] = {
              text: segmentText,
              textRaw: body.value,
              granularity,
            };

            transcription.plaintext += segmentText;
            if (annotation.target) {
              try {
                segment.selector = expandTarget(annotation.target as any);
              } catch (e) {
                // Ignore?
              }
            }

            transcription.segments.push(segment);
          }
        }
      }
    }
  }

  transcription.plaintext = transcription.plaintext.trim();

  if (transcription.plaintext === '' && transcription.segments.length === 0) return null;

  return transcription;
}

export async function getContainerTranscription(
  vault: CompatVault,
  containerRef: Container,
  networkCache: Record<string, any> = {}
): Promise<Transcription | null> {
  // @todo how to avoid loading all external annotation pages? Chicken and egg.
  const container = vault.get<Container>(containerRef);
  const annotationPages = await containerLoadExternalAnnotationPages(vault, container);

  // At this point, we've loaded everything, and we will know if it's null.
  if (!containerHasTranscriptionSync(vault, containerRef, annotationPages)) return null;

  const transcription: Transcription = {
    id: container.id,
    source: container,
    plaintext: '',
    segments: [],
  };

  if (container.duration) {
    // Look for VTT annotations
    for (const annotationPage of annotationPages) {
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            for (const body of getAnnotationBodies(vault, annotation.body)) {
              if (body.format === 'text/vtt') {
                if (body.id) {
                  const vtt = networkCache[body.id] || (await fetch(body.id, { method: 'GET' }).then((r) => r.text()));
                  const transcription = await vttToTranscription(vtt, body.id);
                  if (transcription) {
                    return transcription;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Look for embedded annotations
  pageLabel: for (const annotationPage of annotationPages) {
    for (const annotationRef of annotationPage.items || []) {
      const annotation = vault.get<Annotation>(annotationRef as any);
      if (annotation.motivation?.includes('supplementing')) {
        if (annotation.body) {
          for (const body of getAnnotationBodies(vault, annotation.body)) {
            if (body.format === 'text/plain' || body.type === 'TextualBody') {
              // WE found a page.
              const plaintext = await annotationPageToTranscription(vault, annotationPage);
              if (plaintext) {
                return plaintext;
              }
              // Otherwise skip the rest of the page.
              continue pageLabel;
            }
          }
        }
      }
    }
  }

  // Look for rendering
  if (container.rendering) {
    for (const renderingRef of container.rendering) {
      const rendering = vault.get<ContentResource>(renderingRef as any);
      if (rendering.format === 'text/plain') {
        const plaintext =
          networkCache[rendering.id] || (await fetch(rendering.id, { method: 'GET' }).then((r) => r.text()));
        return { ...transcription, plaintext };
      }
    }
  }

  // Look for ALTO annotations
  if (container.rendering) {
    for (const renderingRef of container.rendering) {
      const rendering = vault.get<ContentResource>(renderingRef as any);
      if (rendering.format === 'application/xml' && rendering.profile === 'http://www.loc.gov/standards/alto/') {
        // @todo parse ALTO
        const transcription = await altoToTranscription(rendering.id);
        if (transcription) {
          return transcription;
        }

        return null;
      }
    }
  }

  return null;
}

export function getCanvasTranscription(
  vault: CompatVault,
  canvasRef: Canvas,
  networkCache: Record<string, any> = {}
): Promise<Transcription | null> {
  return getContainerTranscription(vault, canvasRef, networkCache);
}

export async function manifestHasTranscriptions(
  vault: CompatVault,
  manifest: string | { id: string; type: string } | Manifest,
  pagesToCheck: number = 5
): Promise<boolean> {
  const canvases = vault.get(manifest)?.items || [];
  let hasTranscription = false;
  for (const container of canvases) {
    const fullContainer = vault.get<Container>(container);
    const canvasHasTranscription = containerHasTranscriptionSync(vault, fullContainer);
    if (canvasHasTranscription) {
      hasTranscription = true;
      break;
    }

    // Load external annotations
    if (pagesToCheck > 0) {
      pagesToCheck--;
      const annotationPages = await containerLoadExternalAnnotationPages(vault, fullContainer);
      const canvasHasTranscription = containerHasTranscriptionSync(vault, fullContainer, annotationPages);
      if (canvasHasTranscription) {
        hasTranscription = true;
        break;
      }
    }
  }
  return hasTranscription;
}
