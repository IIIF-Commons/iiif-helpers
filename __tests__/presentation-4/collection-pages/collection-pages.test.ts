import type { CollectionPageNormalized } from '@iiif/parser/presentation-4-normalized/types';
import { validateAuthoredPresentation4 } from '@iiif/parser/presentation-4/validator';
import { describe, expect, test } from 'vitest';
import { Vault4 } from '../../../src/vault/vault4';
import collectionFixture from './fixtures/collection.json';
import page1Fixture from './fixtures/page-1.json';
import page2Fixture from './fixtures/page-2.json';

const collectionId = collectionFixture.id;
const page1Id = page1Fixture.id;
const page2Id = page2Fixture.id;

describe('Vault4 CollectionPage', () => {
  test.each([
    ['collection', collectionFixture],
    ['first page', page1Fixture],
    ['last page', page2Fixture],
  ])('uses a valid Presentation 4 %s fixture', (_name, fixture) => {
    expect(validateAuthoredPresentation4(fixture).valid).toBe(true);
  });

  test('preserves page references without fetching them', () => {
    const vault = new Vault4();
    const collection = vault.loadCollectionSync(collectionId, collectionFixture);

    expect(collection).toMatchObject({
      id: collectionId,
      type: 'Collection',
      first: { id: page1Id, type: 'CollectionPage' },
      last: { id: page2Id, type: 'CollectionPage' },
      total: 3,
    });
    expect(vault.get(page1Id)).toMatchObject({ id: page1Id, type: 'CollectionPage' });
    expect(vault.requestStatus(page1Id)).toBeUndefined();

    expect(vault.toPresentation4<any>({ id: collectionId, type: 'Collection' })).toMatchObject({
      '@context': 'http://iiif.io/api/presentation/4/context.json',
      id: collectionId,
      type: 'Collection',
      first: { id: page1Id, type: 'CollectionPage' },
      last: { id: page2Id, type: 'CollectionPage' },
      total: 3,
    });
  });

  test('loads, gets, and serializes a page as a first-class entity', () => {
    const vault = new Vault4();
    const loaded = vault.loadCollectionPageSync(page1Id, page1Fixture);

    expect(loaded).toMatchObject({
      id: page1Id,
      type: 'CollectionPage',
      partOf: [{ id: collectionId, type: 'Collection' }],
      items: [
        { id: 'https://example.org/iiif/manifest/1', type: 'Manifest' },
        { id: 'https://example.org/iiif/manifest/2', type: 'Manifest' },
      ],
      next: { id: page2Id, type: 'CollectionPage' },
      startIndex: 0,
    });
    expect(vault.getState().iiif.entities.CollectionPage[page1Id]).toBe(loaded);
    expect(vault.getState().iiif.entities.ContentResource[page1Id]).toBeUndefined();
    expect(vault.get<CollectionPageNormalized>({ id: page1Id, type: 'CollectionPage' })).toBe(loaded);

    expect(vault.toPresentation4<any>({ id: page1Id, type: 'CollectionPage' })).toMatchObject(page1Fixture);
  });

  test('preserves the reverse page link and non-zero start index', () => {
    const vault = new Vault4();
    vault.loadCollectionPageSync(page2Id, page2Fixture);

    expect(vault.toPresentation4<any>({ id: page2Id, type: 'CollectionPage' })).toMatchObject({
      id: page2Id,
      type: 'CollectionPage',
      partOf: [{ id: collectionId, type: 'Collection' }],
      prev: { id: page1Id, type: 'CollectionPage' },
      startIndex: 2,
      items: [{ id: 'https://example.org/iiif/manifest/3', type: 'Manifest' }],
    });
  });
});
