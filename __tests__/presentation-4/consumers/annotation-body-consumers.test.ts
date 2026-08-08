import { describe, expect, test, vi } from 'vitest';
import { compatVault } from '../../../src/compat';
import { createPaintingAnnotationsHelper } from '../../../src/painting-annotations';
import { createThumbnailHelper } from '../../../src/thumbnail';
import { annotationPageToTranscription } from '../../../src/transcriptions';
import { Vault4 } from '../../../src/vault/vault4';

const image = (id: string) => ({
  id,
  type: 'Image',
  format: 'image/jpeg',
  width: 100,
  height: 100,
});

describe('Presentation 4 annotation body consumers', () => {
  test('painting ignores an absent body', () => {
    const paintables = createPaintingAnnotationsHelper().getPaintables([
      {
        id: 'https://example.org/annotation/no-body',
        type: 'Annotation',
        motivation: ['painting'],
        body: null,
        target: 'https://example.org/canvas',
      },
    ] as any);
    expect(paintables.items).toEqual([]);
  });

  test('painting preserves Independents order and nested SpecificResource selectors', () => {
    const helper = createPaintingAnnotationsHelper();
    const paintables = helper.getPaintables([
      {
        id: 'https://example.org/annotation/painting',
        type: 'Annotation',
        motivation: ['painting'],
        body: {
          type: 'Independents',
          items: [
            image('https://example.org/image/1'),
            {
              type: 'SpecificResource',
              source: image('https://example.org/image/2'),
              selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
            },
          ],
        },
        target: 'https://example.org/canvas',
      },
    ] as any);

    expect(paintables.items.map(({ resource }) => resource.id)).toEqual([
      'https://example.org/image/1',
      'https://example.org/image/2',
    ]);
    expect(paintables.items.map(({ selector }) => selector)).toEqual([
      null,
      { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
    ]);
  });

  test('painting keeps first-choice default and enabled choice selection', () => {
    const annotation = {
      id: 'https://example.org/annotation/choice',
      type: 'Annotation',
      motivation: ['painting'],
      body: {
        type: 'Choice',
        items: [image('https://example.org/image/default'), image('https://example.org/image/alternate')],
      },
      target: 'https://example.org/canvas',
    };
    const helper = createPaintingAnnotationsHelper();

    expect(helper.getPaintables([annotation] as any).items[0].resource.id).toBe('https://example.org/image/default');

    const alternate = helper.getPaintables([annotation] as any, ['https://example.org/image/alternate']);
    expect(alternate.items.map(({ resource }) => resource.id)).toEqual(['https://example.org/image/alternate']);
    expect((alternate.choice as any).items.map(({ id, selected }: any) => [id, !!selected])).toEqual([
      ['https://example.org/image/default', false],
      ['https://example.org/image/alternate', true],
    ]);

    (annotation.body as any).default = annotation.body.items[1];
    expect(helper.getPaintables([annotation] as any).items[0].resource.id).toBe(
      'https://example.org/image/alternate'
    );
  });

  test('painting selects each sibling Choice independently', () => {
    const paintables = createPaintingAnnotationsHelper().getPaintables(
      [
        {
          id: 'https://example.org/annotation/choices',
          type: 'Annotation',
          motivation: ['painting'],
          body: {
            type: 'Composite',
            items: [
              {
                type: 'Choice',
                items: [image('https://example.org/image/a-default'), image('https://example.org/image/a-alternate')],
              },
              {
                type: 'Choice',
                items: [image('https://example.org/image/b-default'), image('https://example.org/image/b-alternate')],
              },
            ],
          },
          target: 'https://example.org/canvas',
        },
      ] as any,
      ['https://example.org/image/a-alternate']
    );

    expect(paintables.items.map(({ resource }) => resource.id)).toEqual([
      'https://example.org/image/a-alternate',
      'https://example.org/image/b-default',
    ]);
  });

  test('painting resolves nested aggregate references from a normalized Vault4 store', () => {
    const vault = new Vault4();
    const canvasId = 'https://example.org/canvas/normalized-aggregates';
    vault.loadSync('https://example.org/manifest/normalized-aggregates', {
      '@context': 'http://iiif.io/api/presentation/4/context.json',
      id: 'https://example.org/manifest/normalized-aggregates',
      type: 'Manifest',
      label: { en: ['Normalized aggregates'] },
      items: [
        {
          id: canvasId,
          type: 'Canvas',
          width: 100,
          height: 100,
          items: [
            {
              id: 'https://example.org/page/normalized-aggregates',
              type: 'AnnotationPage',
              items: [
                {
                  id: 'https://example.org/annotation/normalized-aggregates',
                  type: 'Annotation',
                  motivation: ['painting'],
                  body: {
                    type: 'Composite',
                    items: [
                      {
                        type: 'Choice',
                        items: [
                          image('https://example.org/image/choice-default'),
                          image('https://example.org/image/choice-alternate'),
                        ],
                      },
                      {
                        type: 'SpecificResource',
                        source: image('https://example.org/image/specific'),
                        selector: [{ type: 'FragmentSelector', value: 'xywh=1,2,3,4' }],
                      },
                    ],
                  },
                  target: canvasId,
                },
              ],
            },
          ],
        },
      ],
    });

    const paintables = createPaintingAnnotationsHelper(vault).getPaintables(canvasId);

    expect(paintables.items.map(({ resource }) => resource.id)).toEqual([
      'https://example.org/image/choice-default',
      'https://example.org/image/specific',
    ]);
    expect(paintables.items[1].selector).toEqual([{ type: 'FragmentSelector', value: 'xywh=1,2,3,4' }]);
  });

  test('thumbnail fallback uses the first Composite body in document order', async () => {
    const getThumbnailFromResource = vi.fn(async (resource) => ({
      best: resource,
      fallback: [],
      log: [],
    }));
    const helper = createThumbnailHelper(compatVault, {
      imageServiceLoader: {
        getImageCandidates: vi.fn(async () => []),
        getThumbnailFromResource,
      } as any,
    });
    const first = image('https://example.org/image/first');

    const result = await helper.getBestThumbnailAtSize(
      {
        id: 'https://example.org/annotation/thumbnail',
        type: 'Annotation',
        body: {
          type: 'Composite',
          items: [first, image('https://example.org/image/second')],
        },
        target: 'https://example.org/canvas',
      } as any,
      { width: 50, height: 50 }
    );

    expect(result.best).toEqual(first);
    expect(getThumbnailFromResource).toHaveBeenLastCalledWith(first, { width: 50, height: 50 }, false, []);
  });

  test('thumbnail fallback uses the authored Choice default', async () => {
    const getThumbnailFromResource = vi.fn(async (resource) => ({ best: resource, fallback: [], log: [] }));
    const helper = createThumbnailHelper(compatVault, {
      imageServiceLoader: { getImageCandidates: vi.fn(async () => []), getThumbnailFromResource } as any,
    });
    const preferred = image('https://example.org/image/preferred');

    const result = await helper.getBestThumbnailAtSize(
      {
        id: 'https://example.org/annotation/thumbnail-choice',
        type: 'Annotation',
        body: { type: 'Choice', default: preferred, items: [image('https://example.org/image/first'), preferred] },
        target: 'https://example.org/canvas',
      } as any,
      { width: 50, height: 50 }
    );

    expect(result.best).toEqual(preferred);
  });

  test('transcription includes every Composite body and the authored Choice default', async () => {
    const transcription = await annotationPageToTranscription(compatVault, {
      id: 'https://example.org/page',
      type: 'AnnotationPage',
      items: [
        {
          id: 'https://example.org/annotation/composite',
          type: 'Annotation',
          motivation: ['supplementing'],
          body: {
            type: 'Composite',
            items: [
              { type: 'TextualBody', value: 'First' },
              { type: 'TextualBody', value: 'second' },
            ],
          },
          target: 'https://example.org/canvas',
        },
        {
          id: 'https://example.org/annotation/choice',
          type: 'Annotation',
          motivation: ['supplementing'],
          body: {
            type: 'Choice',
            default: { id: 'https://example.org/text/alternate', type: 'TextualBody', value: 'alternate' },
            items: [
              { type: 'TextualBody', value: 'preferred' },
              { id: 'https://example.org/text/alternate', type: 'TextualBody', value: 'alternate' },
            ],
          },
          target: 'https://example.org/canvas',
        },
      ],
    } as any);

    expect(transcription?.plaintext).toBe('First second alternate');
    expect(transcription?.segments.map(({ textRaw }) => textRaw)).toEqual(['First', 'second', 'alternate']);
  });
});
