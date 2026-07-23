import { describe, expect, test } from 'vitest';
import { entityActions } from '../../src/vault/actions';
import { createStore } from '../../src/vault/store';
import { resolveType } from '../../src/vault/utility/resolve-type';

describe('Vault profile state policy', () => {
  test('keeps one canonical Container property name', () => {
    const store = createStore();
    const id = 'https://example.org/manifest';
    const placeholder = { id: 'https://example.org/scene', type: 'Scene' };

    store.dispatch(
      entityActions.importEntities({
        entities: {
          Manifest: {
            [id]: { id, type: 'Manifest', items: [], placeholderContainer: placeholder } as any,
          },
        },
      })
    );

    const manifest = store.getState().iiif.entities.Manifest[id] as any;
    expect(manifest.placeholderContainer).toEqual(placeholder);
    expect(manifest).not.toHaveProperty('placeholderCanvas');
  });

  test('complete resources can clear values while external references cannot', () => {
    const id = 'https://example.org/canvas';
    const store = createStore();
    const importCanvas = (canvas: Record<string, unknown>) =>
      store.dispatch(
        entityActions.importEntities({
          entities: { Canvas: { [id]: { id, type: 'Canvas', ...canvas } as any } },
        })
      );

    importCanvas({ label: { en: ['Rich'] }, items: [{ id: `${id}/page`, type: 'AnnotationPage' }] });
    importCanvas({ label: null, items: [], 'iiif-parser:isExternal': true });
    expect((store.getState().iiif.entities.Canvas[id] as any).label).toEqual({ en: ['Rich'] });
    expect((store.getState().iiif.entities.Canvas[id] as any).items).toHaveLength(1);

    importCanvas({ label: null, items: [] });
    expect((store.getState().iiif.entities.Canvas[id] as any).label).toBeNull();
    expect((store.getState().iiif.entities.Canvas[id] as any).items).toEqual([]);
  });

  test.each([
    ['Audio', 'ContentResource'],
    ['Model', 'ContentResource'],
    ['TextualBody', 'ContentResource'],
    ['Choice', 'ContentResource'],
    ['Camera', 'ContentResource'],
    ['AudioEmitters', 'ContentResource'],
    ['WktSelector', 'Selector'],
    ['CollectionPage', 'CollectionPage'],
  ] as const)('routes %s to %s', (input, expected) => {
    expect(resolveType(input)).toBe(expected);
  });
});
