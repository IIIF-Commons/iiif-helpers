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
import { AnnotationNormalized, AnnotationPageNormalized, CanvasNormalized } from '@iiif/presentation-3-normalized';
import { CompatVault } from './compat';
import { Annotation, AnnotationPage, Canvas, ContentResource } from '@iiif/presentation-3';
import { ParsedSelector, TemporalSelector, expandTarget, parseSelector } from './annotation-targets';

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

function canvasHasTranscriptionSync(
  vault: CompatVault,
  canvasRef: Canvas | CanvasNormalized | string,
  annotationPages?: AnnotationPage[] | AnnotationPageNormalized[]
): boolean {
  if (typeof canvasRef === 'string') canvasRef = { id: canvasRef, type: 'Canvas' };
  const canvas = vault.get<CanvasNormalized | Canvas>(canvasRef);

  // Check for rendering
  if (canvas.rendering) {
    for (const renderingRef of canvas.rendering) {
      const rendering = vault.get<ContentResource>(renderingRef as any);
      if ('format' in rendering) {
        if (rendering.format === 'text/plain') return true;
        if (rendering.format === 'application/xml' && rendering?.profile === 'http://www.loc.gov/standards/alto/')
          return true;
      }
    }
  }

  // Check for annotations
  if (canvas.annotations) {
    for (const annotationPageRef of canvas.annotations) {
      const annotationPage = vault.get<AnnotationPageNormalized>(annotationPageRef);
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<AnnotationNormalized | Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            const body = vault.get<ContentResource>(annotation.body as any);
            if (body.format === 'text/vtt') return true;
            if (body.format === 'text/plain') return true;
          }
        }
      }
    }
  }

  // Check for external annotations passed in.
  if (annotationPages) {
    for (const annotationPage of annotationPages) {
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<AnnotationNormalized | Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            const body = vault.get<ContentResource>(annotation.body as any);
            if (body.format === 'text/vtt') return true;
            if (body.format === 'text/plain') return true;
          }
        }
      }
    }
  }

  return false;
}

async function canvasLoadExternalAnnotationPages(vault: CompatVault, canvasRef: Canvas): Promise<AnnotationPage[]>;
async function canvasLoadExternalAnnotationPages(
  vault: CompatVault,
  canvasRef: CanvasNormalized
): Promise<AnnotationPageNormalized[]>;
async function canvasLoadExternalAnnotationPages(
  vault: CompatVault,
  canvasRef: Canvas | CanvasNormalized | string
): Promise<AnnotationPageNormalized[] | AnnotationPage[]> {
  if (typeof canvasRef === 'string') canvasRef = { id: canvasRef, type: 'Canvas' };
  const canvas = vault.get<CanvasNormalized | Canvas>(canvasRef);
  const annotationPages: any[] = [];
  if (canvas.annotations) {
    for (const annotationPageRef of canvas.annotations) {
      const annotationPage = vault.get<AnnotationPageNormalized>(annotationPageRef);
      const requestStatus = vault.requestStatus(annotationPage.id);
      if (!requestStatus) {
        annotationPages.push(await vault.load(annotationPage.id));
      } else {
        annotationPages.push(annotationPage);
      }
    }
  }

  return annotationPages;
}

const vttRegex = /(?m)^(\d{2}:\d{2}:\d{2}\.\d+) +--> +(\d{2}:\d{2}:\d{2}\.\d+).*[\r\n]+\s*(?s)((?:(?!\r?\n\r?\n).)*)/g;

export function timeStampToSeconds(time: string) {
  const [hours, minutes, seconds] = time.split(':').map((t) => parseFloat(t || '0'));
  return hours * 3600 + minutes * 60 + seconds;
}

export async function vttToTranscription(vtt: string, id: string): Promise<Transcription | null> {
  const segments: Transcription['segments'] = [];
  let match;
  while ((match = vttRegex.exec(vtt))) {
    const start = match[1];
    const end = match[2];
    const text = match[3].trim();

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

export async function annotationPageToTranscription(
  vault: CompatVault,
  annotationPage: AnnotationPageNormalized | AnnotationPage
) {
  const transcription: Transcription = {
    id: annotationPage.id,
    source: { id: annotationPage.id, type: 'AnnotationPage' },
    plaintext: '',
    segments: [],
  };

  if (!annotationPage.items) return null;

  for (const annotationRef of annotationPage.items) {
    const annotation = vault.get<AnnotationNormalized | Annotation>(annotationRef as any);
    if (annotation.motivation?.includes('supplementing')) {
      if (annotation.body) {
        // @todo smarter ordering based on position?
        const body = vault.get<ContentResource>(annotation.body as any);
        if (body.format === 'text/plain') {
          if (body.value && typeof body.value === 'string') {
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
            } else {
              // Not a segment?
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

export async function getCanvasTranscription(vault: CompatVault, canvasRef: Canvas): Promise<Transcription | null> {
  // @todo how to avoid loading all external annotation pages? Chicken and egg.
  const canvas = vault.get<CanvasNormalized | Canvas>(canvasRef);
  const annotationPages = await canvasLoadExternalAnnotationPages(vault, canvas);

  // At this point, we've loaded everything, and we will know if it's null.
  if (!canvasHasTranscriptionSync(vault, canvasRef, annotationPages)) return null;

  const transcription: Transcription = {
    id: canvas.id,
    source: canvas,
    plaintext: '',
    segments: [],
  };

  if (canvas.duration) {
    // Look for VTT annotations
    for (const annotationPage of annotationPages) {
      for (const annotationRef of annotationPage.items || []) {
        const annotation = vault.get<AnnotationNormalized | Annotation>(annotationRef as any);
        if (annotation.motivation?.includes('supplementing')) {
          if (annotation.body) {
            const body = vault.get<ContentResource>(annotation.body as any);
            if (body.format === 'text/vtt') {
              if (body.id) {
                const vtt = await fetch(body.id, { method: 'GET' }).then((r) => r.text());
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

  // Look for embedded annotations
  pageLabel: for (const annotationPage of annotationPages) {
    for (const annotationRef of annotationPage.items || []) {
      const annotation = vault.get<AnnotationNormalized | Annotation>(annotationRef as any);
      if (annotation.motivation?.includes('supplementing')) {
        if (annotation.body) {
          const body = vault.get<ContentResource>(annotation.body as any);
          if (body.format === 'text/plain') {
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

  // Look for rendering
  if (canvas.rendering) {
    for (const renderingRef of canvas.rendering) {
      const rendering = vault.get<ContentResource>(renderingRef as any);
      if (rendering.format === 'text/plain') {
        const plaintext = await fetch(rendering.id, { method: 'GET' }).then((r) => r.text());
        return { ...transcription, plaintext };
      }
    }
  }

  // Look for ALTO annotations
  if (canvas.rendering) {
    for (const renderingRef of canvas.rendering) {
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
