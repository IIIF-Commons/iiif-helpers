import invariant from 'tiny-invariant';
import { describe, expect, test } from 'vitest';
import type { ManifestNormalized } from '@iiif/parser/presentation-3-normalized/types';
import cssManifest from '../../fixtures/cookbook/css.json';
import p4SceneManifest from '../../fixtures/presentation-4/cookbook/0608-mvm-3d.json';
import { Vault, Vault4 } from '../../src/vault';

describe('Vault versions', () => {
  test('Vault remains stable for v3 fixtures', () => {
    const vaultA = new Vault();
    const vaultB = new Vault();

    const manifestA = vaultA.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    const manifestB = vaultB.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));

    invariant(manifestA);
    invariant(manifestB);

    expect(manifestA.id).toBe(manifestB.id);
    expect(manifestA.type).toBe(manifestB.type);
    expect(manifestA.items.length).toBe(manifestB.items.length);
    expect(vaultA.getState().iiif.mapping).toEqual(vaultB.getState().iiif.mapping);
  });

  test('Vault4 can load v3 fixtures', () => {
    const vault4 = new Vault4();
    const manifest = vault4.loadManifestSync(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));

    invariant(manifest);
    expect(manifest.id).toBe(cssManifest.id);
    expect(manifest.type).toBe('Manifest');
    expect(manifest.items.length).toBeGreaterThan(0);
  });

  test('Vault4 serializes with presentation-4 serializer and downgrades scene manifests safely', () => {
    const vault4 = new Vault4();
    const manifest = vault4.loadManifestSync(p4SceneManifest.id, JSON.parse(JSON.stringify(p4SceneManifest)));
    invariant(manifest);

    const asV4: any = vault4.toPresentation4(manifest);
    expect(asV4['@context']).toBe('http://iiif.io/api/presentation/4/context.json');
    expect(asV4.items[0].type).toBe('Scene');

    expect(() => vault4.toPresentation3<any>(manifest)).toThrowError(
      'Presentation 4 -> 3 downgrade unsupported: Scene container'
    );
  });
});
