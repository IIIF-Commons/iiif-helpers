import { Vault } from '../src';
import { canvasLoadExternalAnnotationPages } from '../src/transcriptions';

describe('transcription external annotation page loading', () => {
  test('uses resolved request resource when annotation page id differs from request URL', async () => {
    const vault = new Vault();
    const canvasId = 'https://example.org/canvas/1';
    const annotationPageRequestUrl = 'https://example.org/annotation-page/requested';
    const annotationPageActualId = 'https://example.org/annotation-page/actual';

    await vault.load(canvasId, {
      id: canvasId,
      type: 'Canvas',
      annotations: [
        {
          id: annotationPageRequestUrl,
          type: 'AnnotationPage',
        },
      ],
    });

    await vault.load(annotationPageRequestUrl, {
      id: annotationPageActualId,
      type: 'AnnotationPage',
      items: [
        {
          id: `${annotationPageActualId}/annotation/1`,
          type: 'Annotation',
          motivation: 'supplementing',
          body: {
            id: `${annotationPageActualId}/body/1`,
            type: 'TextualBody',
            value: 'Hello world',
            format: 'text/plain',
          },
          target: canvasId,
        },
      ],
    });

    const pages = await canvasLoadExternalAnnotationPages(vault as any, canvasId);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.id).toEqual(annotationPageActualId);
    expect(pages[0]?.items?.length).toEqual(1);
  });
});
