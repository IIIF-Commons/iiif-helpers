import { validateAuthoredPresentation4 } from '@iiif/parser/presentation-4/validator';
import { describe, expect, test, vi } from 'vitest';
import { Vault4 } from '../../../src/vault/vault4';
import collection from '../collection-pages/fixtures/collection.json';
import collectionPage1 from '../collection-pages/fixtures/page-1.json';
import collectionPage2 from '../collection-pages/fixtures/page-2.json';
import annotationCollection from './fixtures/annotation-collection.json';
import annotationPage1 from './fixtures/annotation-page-1.json';
import annotationPage2 from './fixtures/annotation-page-2.json';

function fixtureFetcher(fixtures: Array<{ id: string }>) {
  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  return vi.fn(async (id: string) => {
    const fixture = byId.get(id);
    if (!fixture) {
      throw new Error(`Missing fixture: ${id}`);
    }
    return structuredClone(fixture);
  });
}

describe('Vault page chains', () => {
  test.each([
    collection,
    collectionPage1,
    collectionPage2,
    annotationCollection,
    annotationPage1,
    annotationPage2,
  ])('uses valid Presentation 4 fixture $id', (fixture) => {
    expect(validateAuthoredPresentation4(fixture).valid).toBe(true);
  });

  test('loads a complete CollectionPage chain in order', async () => {
    const fetcher = fixtureFetcher([collection, collectionPage1, collectionPage2]);
    const vault = new Vault4({ customFetcher: fetcher });
    await vault.load(collection.id);

    const state = await vault.loadPageChain(collection.id);

    expect(state).toMatchObject({
      currentPage: collectionPage2.id,
      currentLength: 3,
      isFullyLoaded: true,
      totalItems: 3,
      pages: [
        { id: collectionPage1.id, type: 'CollectionPage', startIndex: 0, pageLength: 2, order: 0 },
        { id: collectionPage2.id, type: 'CollectionPage', startIndex: 2, pageLength: 1, order: 1 },
      ],
    });
    expect(vault.get(collection.id)).toMatchObject({
      label: { en: ['Paged collection'] },
      first: { id: collectionPage1.id, type: 'CollectionPage' },
      total: 3,
    });
    expect(vault.getPaginatedItems(collection.id)).toEqual([
      { id: 'https://example.org/iiif/manifest/1', type: 'Manifest' },
      { id: 'https://example.org/iiif/manifest/2', type: 'Manifest' },
      { id: 'https://example.org/iiif/manifest/3', type: 'Manifest' },
    ]);
    expect(validateAuthoredPresentation4(vault.toPresentation4({ id: collection.id, type: 'Collection' })).valid).toBe(
      true
    );
  });

  test('loads AnnotationPage chains and deduplicates references', async () => {
    const secondPageWithDuplicate = {
      ...annotationPage2,
      items: [annotationPage1.items[0], ...annotationPage2.items],
    };
    const fetcher = fixtureFetcher([annotationCollection, annotationPage1, secondPageWithDuplicate]);
    const vault = new Vault4({ customFetcher: fetcher });
    await vault.load(annotationCollection.id);

    const state = await vault.loadPageChain(annotationCollection.id);

    expect(state).toMatchObject({
      currentLength: 2,
      isFullyLoaded: true,
      totalItems: 2,
      pages: [
        { id: annotationPage1.id, type: 'AnnotationPage', startIndex: 0, order: 0 },
        { id: annotationPage2.id, type: 'AnnotationPage', startIndex: 1, order: 1 },
      ],
    });
    expect(vault.getPaginatedItems(annotationCollection.id)).toEqual([
      { id: 'https://example.org/iiif/annotation/1', type: 'Annotation' },
      { id: 'https://example.org/iiif/annotation/2', type: 'Annotation' },
    ]);
    const serialized = vault.toPresentation4<any>({
      id: annotationCollection.id,
      type: 'AnnotationCollection',
    } as any);
    expect(serialized).toMatchObject({
      id: annotationCollection.id,
      first: { id: annotationPage1.id, type: 'AnnotationPage' },
      last: { id: annotationPage2.id, type: 'AnnotationPage' },
      total: 2,
    });
    expect(serialized.items).toBeUndefined();
  });

  test('stops safely on a cyclic next link', async () => {
    const cyclicPage = {
      ...collectionPage1,
      next: { id: collectionPage1.id, type: 'CollectionPage' },
    };
    const vault = new Vault4({
      customFetcher: fixtureFetcher([collection, cyclicPage]),
    });
    await vault.load(collection.id);

    const state = await vault.loadPageChain(collection.id);

    expect(state?.isFullyLoaded).toBe(true);
    expect(state?.pages).toHaveLength(1);
    expect(state?.error).toMatchObject({
      message: `Pagination cycle detected at ${collectionPage1.id}`,
    });
  });

  test('records a broken page without losing the loaded prefix', async () => {
    const vault = new Vault4({
      customFetcher: fixtureFetcher([collection, collectionPage1]),
    });
    await vault.load(collection.id);

    const state = await vault.loadPageChain(collection.id);

    expect(state?.isFetching).toBe(false);
    expect(state?.pages.map((page) => page.id)).toEqual([collectionPage1.id]);
    expect(state?.error.message).toBe(`Missing fixture: ${collectionPage2.id}`);
    expect(vault.getPaginatedItems(collection.id)).toHaveLength(2);
  });
});
