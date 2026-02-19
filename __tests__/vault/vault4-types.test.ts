import { describe, expectTypeOf, test } from 'vitest';
import type {
  CollectionNormalized,
  ManifestNormalized,
  SceneNormalized,
} from '@iiif/parser/presentation-4-normalized/types';
import cssManifest from '../../fixtures/cookbook/css.json';
import p4SceneManifest from '../../fixtures/presentation-4/cookbook/0608-mvm-3d.json';
import { Vault4 } from '../../src/vault';

describe('Vault4 types', () => {
  test('core method signatures remain type-safe', () => {
    const vault = new Vault4();

    const loadedManifest = vault.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    expectTypeOf(loadedManifest).toEqualTypeOf<ManifestNormalized | undefined>();

    const loadedManifestViaHelper = vault.loadManifest(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    expectTypeOf(loadedManifestViaHelper).toMatchTypeOf<Promise<ManifestNormalized | undefined>>();

    const loadedManifestAsync = vault.load<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    expectTypeOf(loadedManifestAsync).toMatchTypeOf<Promise<ManifestNormalized | undefined>>();

    const scene = vault.get({ id: 'https://example.org/scene/1', type: 'Scene' });
    expectTypeOf(scene).toMatchTypeOf<SceneNormalized>();

    const hydratedScene = vault.hydrate({ id: 'https://example.org/scene/1', type: 'Scene' });
    expectTypeOf(hydratedScene).toMatchTypeOf<SceneNormalized>();

    const manifestRef = vault.get({ id: 'https://example.org/manifest/1', type: 'Manifest' });
    expectTypeOf(manifestRef).toMatchTypeOf<ManifestNormalized>();

    const collectionRef = vault.get({ id: 'https://example.org/collection/1', type: 'Collection' });
    expectTypeOf(collectionRef).toMatchTypeOf<CollectionNormalized>();

    const collection = vault.loadSync<CollectionNormalized>(
      'https://example.org/collection/1',
      JSON.parse(JSON.stringify({ id: 'https://example.org/collection/1', type: 'Collection', items: [] }))
    );

    expectTypeOf(collection).toMatchTypeOf<CollectionNormalized | undefined>();

    const collectionViaHelper = vault.loadCollection(
      'https://example.org/collection/1',
      JSON.parse(JSON.stringify({ id: 'https://example.org/collection/1', type: 'Collection', items: [] }))
    );
    expectTypeOf(collectionViaHelper).toMatchTypeOf<Promise<CollectionNormalized | undefined>>();

    const wrapped = vault.loadManifestObject(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    expectTypeOf(wrapped).toMatchTypeOf<Promise<unknown>>();

    const sceneObject = vault.getObject({ id: 'https://example.org/scene/1', type: 'Scene' });
    expectTypeOf(sceneObject).toMatchTypeOf<SceneNormalized>();
  });

  test('presentation-4 resources stay strongly typed', () => {
    const vault = new Vault4();
    vault.loadSync(p4SceneManifest.id, JSON.parse(JSON.stringify(p4SceneManifest)));

    const scene = vault.get({ id: 'https://iiif.io/api/cookbook/recipe/0608-mvm-3d/scene/1', type: 'Scene' });
    expectTypeOf(scene).toMatchTypeOf<SceneNormalized>();
  });
});
