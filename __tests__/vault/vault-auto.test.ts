import type { ManifestNormalized as ManifestNormalizedV3 } from '@iiif/parser/presentation-3-normalized/types';
import type { ManifestNormalized as ManifestNormalizedV4 } from '@iiif/parser/presentation-4-normalized/types';
import invariant from 'tiny-invariant';
import { describe, expect, test } from 'vitest';
import cssManifest from '../../fixtures/cookbook/css.json';
import p4SceneManifest from '../../fixtures/presentation-4/cookbook/0608-mvm-3d.json';
import p4UpgradedCssManifest from '../../fixtures/presentation-4/upgraded-from-p3/cookbook--css.json';
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
    const manifest = vault.loadSync<ManifestNormalizedV3>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    invariant(manifest);

    expect(manifest.id).toBe(cssManifest.id);
    expect(vault.getVersion()).toBe(3);
    expect(vault.v4).toBeUndefined();
  });

  test('switches to v4 when Scene is loaded and opt-in is enabled', () => {
    const vault = new VaultAuto({ enablePresentation4: true });

    const v3Manifest = vault.loadSync<ManifestNormalizedV3>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    invariant(v3Manifest);

    const v4Manifest = vault.loadSync<ManifestNormalizedV4>(
      p4SceneManifest.id,
      JSON.parse(JSON.stringify(p4SceneManifest))
    );
    invariant(v4Manifest);

    expect(vault.getVersion()).toBe(4);
    expect(vault.isPresentation4()).toBe(true);
    expect(vault.v4).toBeDefined();

    // Ensure replay kept earlier loaded v3 resources available after switch.
    const replayedV3Manifest = vault.get({
      id: cssManifest.id,
      type: 'Manifest',
    });
    expect(replayedV3Manifest).toBeTruthy();
    expect((replayedV3Manifest as any).id).toBe(cssManifest.id);
  });

  test('surfaces .get() target-resolution drift on shared non-3D content after v4 switch', () => {
    const annotationId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/page/p2/anno-1';
    const canvasId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/canvas/p1';

    const v3Vault = new VaultAuto();
    v3Vault.loadSync<ManifestNormalizedV3>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    const v3Annotation = v3Vault.get({
      id: annotationId,
      type: 'Annotation',
    }) as any;
    const v3Target = v3Vault.get(v3Annotation.target) as any;

    expect(v3Vault.getVersion()).toBe(3);
    expect(v3Annotation.target.type).toBe('SpecificResource');
    expect(v3Target.type).toBe('Canvas');
    expect(v3Target.id).toBe(canvasId);

    const v4Vault = new VaultAuto({ enablePresentation4: true });
    v4Vault.loadSync<ManifestNormalizedV4>(p4UpgradedCssManifest.id, JSON.parse(JSON.stringify(p4UpgradedCssManifest)));
    const v4Annotation = v4Vault.get({
      id: annotationId,
      type: 'Annotation',
    }) as any;
    const v4Target = v4Vault.get(v4Annotation.target) as any;

    expect(v4Vault.getVersion()).toBe(4);
    expect(v4Annotation.target.type).toBe('ContentResource');
    expect(v4Target.type).toBe('SpecificResource');
    expect(v4Target.source.id).toBe(canvasId);
    expect(Array.isArray(v4Target.selector)).toBe(true);
  });

  test('surfaces .get() body-resolution drift on shared non-3D content after v4 switch', () => {
    const annotationId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/page/p2/anno-1';
    const textualBodyId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/body/text1';

    const v3Vault = new VaultAuto();
    v3Vault.loadSync<ManifestNormalizedV3>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    const v3Annotation = v3Vault.get({
      id: annotationId,
      type: 'Annotation',
    }) as any;
    const v3Body = v3Vault.get(v3Annotation.body) as any[];

    expect(Array.isArray(v3Annotation.body)).toBe(true);
    expect(Array.isArray(v3Body)).toBe(true);
    expect(v3Body[0].id).toBe(textualBodyId);
    expect(v3Body[0].type).toBe('TextualBody');

    const v4Vault = new VaultAuto({ enablePresentation4: true });
    v4Vault.loadSync<ManifestNormalizedV4>(p4UpgradedCssManifest.id, JSON.parse(JSON.stringify(p4UpgradedCssManifest)));
    const v4Annotation = v4Vault.get({
      id: annotationId,
      type: 'Annotation',
    }) as any;
    const v4Body = v4Vault.get(v4Annotation.body) as any;
    const v4BodySource = v4Vault.get(v4Body.source) as any;

    expect(v4Vault.getVersion()).toBe(4);
    expect(Array.isArray(v4Annotation.body)).toBe(false);
    expect(v4Annotation.body.type).toBe('ContentResource');
    expect(v4Body.type).toBe('SpecificResource');
    expect(v4BodySource.id).toBe(textualBodyId);
    expect(v4BodySource.type).toBe('TextualBody');
  });

  test('provides stable target/body helpers across v3 and v4 for shared fixtures', () => {
    const annotationRef = {
      id: 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/page/p2/anno-1',
      type: 'Annotation',
    };
    const canvasId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/canvas/p1';
    const textualBodyId = 'https://preview.iiif.io/cookbook/0045-css/recipe/0045-css/body/text1';

    const v3Vault = new VaultAuto();
    v3Vault.loadSync<ManifestNormalizedV3>(cssManifest.id, JSON.parse(JSON.stringify(cssManifest)));
    const v3Targets = v3Vault.resolveAnnotationTargets(annotationRef);
    const v3Bodies = v3Vault.resolveAnnotationBodies(annotationRef) as any[];

    expect(v3Targets).toHaveLength(1);
    expect(v3Targets[0].source.id).toBe(canvasId);
    expect(v3Targets[0].selector).toEqual([{ type: 'FragmentSelector', value: 'xywh=700,1250,1850,1150' }]);
    expect(v3Bodies).toHaveLength(1);
    expect(v3Bodies[0].id).toBe(textualBodyId);
    expect(v3Bodies[0].type).toBe('TextualBody');

    const v4Vault = new VaultAuto({ enablePresentation4: true });
    v4Vault.loadSync<ManifestNormalizedV4>(p4UpgradedCssManifest.id, JSON.parse(JSON.stringify(p4UpgradedCssManifest)));
    const v4Targets = v4Vault.resolveAnnotationTargets(annotationRef);
    const v4Bodies = v4Vault.resolveAnnotationBodies(annotationRef) as any[];

    expect(v4Vault.getVersion()).toBe(4);
    expect(v4Targets).toHaveLength(1);
    expect(v4Targets[0].source.id).toBe(canvasId);
    expect(v4Targets[0].selector).toEqual([{ type: 'FragmentSelector', value: 'xywh=700,1250,1850,1150' }]);
    expect(v4Bodies).toHaveLength(1);
    expect(v4Bodies[0].id).toBe(textualBodyId);
    expect(v4Bodies[0].type).toBe('TextualBody');

    expect(v4Vault.asArray('x')).toEqual(['x']);
    expect(v4Vault.asArray(['x', 'y'])).toEqual(['x', 'y']);
    expect(v4Vault.asArray(null)).toEqual([]);
  });
});
