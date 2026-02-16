import invariant from 'tiny-invariant';
import { describe, expect, test } from 'vitest';
import cssManifest from '../../fixtures/cookbook/css.json';
import p4SceneManifest from '../../fixtures/presentation-4/cookbook/0608-mvm-3d.json';
import type { ManifestNormalized } from '@iiif/parser/presentation-3-normalized/types';
import { VaultAuto } from '../../src/vault';

describe('VaultAuto', () => {
  test('starts in v3 mode by default', () => {
    const vault = new VaultAuto();
    expect(vault.getVersion()).toBe(3);
    expect(vault.isPresentation4()).toBe(false);
    expect(vault.v4).toBeUndefined();
  });

  test('stays on v3 for v3 fixtures', () => {
    const vault = new VaultAuto();
    const manifest = vault.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    invariant(manifest);

    expect(manifest.id).toBe(cssManifest.id);
    expect(vault.getVersion()).toBe(3);
    expect(vault.v4).toBeUndefined();
  });

  test('switches to v4 when Scene is loaded and opt-in is enabled', () => {
    const vault = new VaultAuto({ enablePresentation4: true });

    const v3Manifest = vault.loadSync<ManifestNormalized>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    invariant(v3Manifest);

    const v4Manifest = vault.loadSync<ManifestNormalized>(p4SceneManifest.id, JSON.parse(JSON.stringify(p4SceneManifest)));
    invariant(v4Manifest);

    expect(vault.getVersion()).toBe(4);
    expect(vault.isPresentation4()).toBe(true);
    expect(vault.v4).toBeDefined();

    // Ensure replay kept earlier loaded v3 resources available after switch.
    const replayedV3Manifest = vault.get(cssManifest.id);
    expect(replayedV3Manifest).toBeTruthy();
    expect((replayedV3Manifest as any).id).toBe(cssManifest.id);
  });
});
