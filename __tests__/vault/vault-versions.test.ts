import invariant from 'tiny-invariant';
import { describe, expect, test } from 'vitest';
import type { ManifestNormalized } from '@iiif/parser/presentation-3-normalized/types';
import cssManifest from '../../fixtures/cookbook/css.json';
import { Vault, Vault3, Vault4 } from '../../src/vault';

describe('Vault versions', () => {
  test('Vault remains backwards-compatible with Vault3 for v3 fixtures', () => {
    const autoVault = new Vault();
    const vault3 = new Vault3();

    const autoManifest = autoVault.loadSync<ManifestNormalized>(
      cssManifest.id,
      JSON.parse(JSON.stringify(cssManifest))
    );
    const v3Manifest = vault3.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));

    invariant(autoManifest);
    invariant(v3Manifest);

    expect(autoManifest.id).toBe(v3Manifest.id);
    expect(autoManifest.type).toBe(v3Manifest.type);
    expect(autoManifest.items.length).toBe(v3Manifest.items.length);
    expect(autoVault.getState().iiif.mapping).toEqual(vault3.getState().iiif.mapping);
  });

  test('Vault4 can load v3 fixtures', () => {
    const vault4 = new Vault4();
    const manifest = vault4.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));

    invariant(manifest);
    expect(manifest.id).toBe(cssManifest.id);
    expect(manifest.type).toBe('Manifest');
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});
