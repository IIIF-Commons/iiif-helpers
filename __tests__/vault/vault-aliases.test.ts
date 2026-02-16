import { describe, expect, test } from 'vitest';
import { createStore } from '../../src/vault/store';
import { entityActions } from '../../src/vault/actions';

describe('Vault alias compatibility', () => {
  test('mirrors container aliases when importing entities', () => {
    const store = createStore();
    const manifestId = 'https://example.org/manifest/alias-import';
    const accompanying = { id: 'https://example.org/canvas/a', type: 'Canvas' };
    const placeholder = { id: 'https://example.org/canvas/p', type: 'Canvas' };

    store.dispatch(
      entityActions.importEntities({
        entities: {
          Manifest: {
            [manifestId]: {
              id: manifestId,
              type: 'Manifest',
              items: [],
              accompanyingContainer: accompanying,
              placeholderContainer: placeholder,
            } as any,
          },
        },
      })
    );

    const manifest = store.getState().iiif.entities.Manifest[manifestId] as any;
    expect(manifest.accompanyingContainer).toEqual(accompanying);
    expect(manifest.accompanyingCanvas).toEqual(accompanying);
    expect(manifest.placeholderContainer).toEqual(placeholder);
    expect(manifest.placeholderCanvas).toEqual(placeholder);
  });

  test('mirrors container aliases when modifying entities', () => {
    const store = createStore();
    const manifestId = 'https://example.org/manifest/alias-modify';
    const accompanyingA = { id: 'https://example.org/canvas/1', type: 'Canvas' };
    const accompanyingB = { id: 'https://example.org/canvas/2', type: 'Canvas' };
    const placeholderA = { id: 'https://example.org/canvas/3', type: 'Canvas' };
    const placeholderB = { id: 'https://example.org/canvas/4', type: 'Canvas' };

    store.dispatch(
      entityActions.importEntities({
        entities: {
          Manifest: {
            [manifestId]: {
              id: manifestId,
              type: 'Manifest',
              items: [],
              accompanyingCanvas: null,
              placeholderCanvas: null,
            } as any,
          },
        },
      })
    );

    store.dispatch(
      entityActions.modifyEntityField({
        id: manifestId,
        type: 'Manifest',
        key: 'accompanyingCanvas',
        value: accompanyingA,
      })
    );
    store.dispatch(
      entityActions.modifyEntityField({
        id: manifestId,
        type: 'Manifest',
        key: 'accompanyingContainer',
        value: accompanyingB,
      })
    );
    store.dispatch(
      entityActions.modifyEntityField({
        id: manifestId,
        type: 'Manifest',
        key: 'placeholderCanvas',
        value: placeholderA,
      })
    );
    store.dispatch(
      entityActions.modifyEntityField({
        id: manifestId,
        type: 'Manifest',
        key: 'placeholderContainer',
        value: placeholderB,
      })
    );

    const manifest = store.getState().iiif.entities.Manifest[manifestId] as any;
    expect(manifest.accompanyingCanvas).toEqual(accompanyingB);
    expect(manifest.accompanyingContainer).toEqual(accompanyingB);
    expect(manifest.placeholderCanvas).toEqual(placeholderB);
    expect(manifest.placeholderContainer).toEqual(placeholderB);
  });
});
