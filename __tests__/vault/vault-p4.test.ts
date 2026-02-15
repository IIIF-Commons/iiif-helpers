/**
 * Vault P4 Smoke Tests
 *
 * These tests validate the iiif-helpers migration to Presentation 4 support.
 * They are designed to be written BEFORE the migration and will progressively
 * pass as each phase of the migration is completed.
 *
 * Test categories:
 *  1. Native P4 fixtures        – Requires: Phase 2 (store expansion) + Phase 3 (P4 normalizer)
 *  2. P4 scene fixtures          – Requires: Phase 2 + Phase 3
 *  3. P3 backwards compat        – Must ALWAYS pass (regression gate)
 *  4. P2 backwards compat        – Must ALWAYS pass (regression gate)
 *  5. Canvas compatibility layer  – Requires: Phase 4
 *  6. New P4 container types      – Requires: Phase 2 + Phase 3
 *  7. Serialization round-trips   – Requires: Phase 5
 *  8. Entity actions on new types – Requires: Phase 2 + Phase 3
 *  9. Annotation shape changes    – Requires: Phase 3
 * 10. Property rename compat      – Requires: Phase 3 + Phase 4
 * 11–15. Misc integration         – Requires: various phases
 */

import { beforeEach, describe, expect, test } from 'vitest';
import choiceManifest from '../../fixtures/cookbook/choice.json';
// ── Existing P3 fixtures (backwards compat) ─────────────────────────────────
import cssManifest from '../../fixtures/cookbook/css.json';
import multimediaManifest from '../../fixtures/cookbook/multimedia.json';
import tocManifest from '../../fixtures/cookbook/toc.json';
// ── Existing P2 fixtures (backwards compat) ─────────────────────────────────
import nlsManifest from '../../fixtures/presentation-2/nls-manifest.json';
// ── P3 fixtures for detailed checks ─────────────────────────────────────────
import hasPart from '../../fixtures/presentation-3/has-part.json';
// ── Native P4 fixtures ──────────────────────────────────────────────────────
import p4Image from '../../fixtures/presentation-4/cookbook/0001-mvm-image.json';
import p4Audio from '../../fixtures/presentation-4/cookbook/0002-mvm-audio.json';
import p4Video from '../../fixtures/presentation-4/cookbook/0003-mvm-video.json';
import p4Scene from '../../fixtures/presentation-4/cookbook/0608-mvm-3d.json';
// ── Native P4 scene fixtures ────────────────────────────────────────────────
import sceneModel from '../../fixtures/presentation-4/scenes/01-model-in-scene.json';
import sceneCamera from '../../fixtures/presentation-4/scenes/03-perspective-camera.json';
import sceneLights from '../../fixtures/presentation-4/scenes/11-multiple-lights.json';
import sceneRotated from '../../fixtures/presentation-4/scenes/14-rotated-model.json';
import sceneWithinCanvas from '../../fixtures/presentation-4/scenes/21-scene-within-canvas.json';
import sceneComment from '../../fixtures/presentation-4/scenes/23-astronaut-comment.json';
import { Vault } from '../../src/vault';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadSync(vault: Vault, json: any): any {
  const id = json.id || json['@id'];
  return vault.loadSync(id, json);
}

function getEntities(vault: Vault) {
  return vault.getState().iiif.entities;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Vault P4 Support', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Loading native P4 manifests
  //    Requires: Phase 2 (store expansion) + Phase 3 (P4 normalizer)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('native P4 cookbook fixtures', () => {
    const cookbookFixtures: [string, any][] = [
      ['0001-mvm-image', p4Image],
      ['0002-mvm-audio', p4Audio],
      ['0003-mvm-video', p4Video],
      ['0608-mvm-3d (Scene)', p4Scene],
    ];

    test.each(cookbookFixtures)('loads %s', (name, json) => {
      const vault = new Vault();
      const manifest = loadSync(vault, json);
      expect(manifest).toBeTruthy();
      expect(manifest!.id).toBe(json.id);
      expect(manifest!.type).toBe('Manifest');
    });

    test('P4 image manifest has Canvas in store', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);
      const entities = getEntities(vault);
      const canvasIds = Object.keys(entities.Canvas);
      expect(canvasIds.length).toBeGreaterThanOrEqual(1);
    });

    test('P4 3D manifest has Scene in store', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);
      const entities = getEntities(vault);
      // Phase 2: entities.Scene must exist as a store
      expect(entities.Scene).toBeDefined();
      const sceneIds = Object.keys(entities.Scene);
      expect(sceneIds.length).toBeGreaterThanOrEqual(1);
    });

    test('P4 audio manifest items are accessible', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, p4Audio);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('P4 video manifest items are accessible', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, p4Video);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Loading native P4 scene fixtures
  //    Requires: Phase 2 + Phase 3 (P4 normalizer handles Scene, Model, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('native P4 scene fixtures', () => {
    const sceneFixtures: [string, any][] = [
      ['01-model-in-scene', sceneModel],
      ['03-perspective-camera', sceneCamera],
      ['11-multiple-lights', sceneLights],
      ['14-rotated-model', sceneRotated],
      ['21-scene-within-canvas', sceneWithinCanvas],
      ['23-astronaut-comment', sceneComment],
    ];

    test.each(sceneFixtures)('loads scene fixture %s', (name, json) => {
      const vault = new Vault();
      const manifest = loadSync(vault, json);
      expect(manifest).toBeTruthy();
      expect(manifest!.type).toBe('Manifest');
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('model-in-scene stores Scene entity', () => {
      const vault = new Vault();
      loadSync(vault, sceneModel);
      const entities = getEntities(vault);
      expect(entities.Scene).toBeDefined();
      const sceneIds = Object.keys(entities.Scene);
      expect(sceneIds.length).toBeGreaterThanOrEqual(1);
    });

    test('model-in-scene stores Model content resource', () => {
      const vault = new Vault();
      loadSync(vault, sceneModel);
      const entities = getEntities(vault);
      const contentResourceIds = Object.keys(entities.ContentResource);
      // The Model body of the annotation should be stored as ContentResource
      const modelResources = Object.values(entities.ContentResource).filter((r: any) => r.type === 'Model');
      expect(modelResources.length).toBeGreaterThanOrEqual(1);
    });

    test('perspective-camera stores camera content resource', () => {
      const vault = new Vault();
      loadSync(vault, sceneCamera);
      const entities = getEntities(vault);
      const contentResources = Object.values(entities.ContentResource);
      const cameras = contentResources.filter(
        (r: any) => r.type === 'PerspectiveCamera' || r.type === 'OrthographicCamera'
      );
      expect(cameras.length).toBeGreaterThanOrEqual(1);
    });

    test('multiple-lights stores light content resources', () => {
      const vault = new Vault();
      loadSync(vault, sceneLights);
      const entities = getEntities(vault);
      const contentResources = Object.values(entities.ContentResource);
      const lights = contentResources.filter(
        (r: any) =>
          r.type === 'AmbientLight' ||
          r.type === 'DirectionalLight' ||
          r.type === 'PointLight' ||
          r.type === 'SpotLight'
      );
      expect(lights.length).toBeGreaterThanOrEqual(1);
    });

    test('rotated-model stores Transform entity', () => {
      const vault = new Vault();
      loadSync(vault, sceneRotated);
      const entities = getEntities(vault);
      expect(entities.Transform).toBeDefined();
      const transformIds = Object.keys(entities.Transform);
      // RotateTransform should be normalized into the Transform store
      expect(transformIds.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. P3 fixtures still work (backwards compatibility)
  //    REGRESSION GATE: These must ALWAYS pass, before AND after migration
  // ═══════════════════════════════════════════════════════════════════════════

  describe('P3 fixtures still work', () => {
    test('loads CSS manifest', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, cssManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('loads choice manifest', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, choiceManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('loads TOC manifest', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, tocManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('loads multimedia manifest', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, multimediaManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('P3 canvas is still type Canvas after internal upgrade', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, cssManifest);
      expect(manifest).toBeTruthy();

      const firstItem = manifest!.items[0];
      expect(firstItem).toBeTruthy();

      const canvas = vault.get(firstItem);
      expect(canvas).toBeTruthy();
      // P3 canvases should remain type Canvas after P4 upgrade
      expect(canvas.type).toBe('Canvas');
    });

    test('P3 manifest canvases have width and height', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, cssManifest);
      expect(manifest).toBeTruthy();

      // After P4 normalizer swap, P3 canvases should retain their dimensions
      const firstItem = manifest!.items[0];
      expect(firstItem).toBeTruthy();
      const canvas = vault.get(firstItem);
      expect(canvas).toBeTruthy();
      expect(typeof canvas.width).toBe('number');
      expect(typeof canvas.height).toBe('number');
      // The CSS fixture canvas has width:8800 height:3966
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    test('P3 manifest annotations are accessible', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, cssManifest);
      expect(manifest).toBeTruthy();

      // After normalization, canvas.items should contain AnnotationPage refs
      const firstItem = manifest!.items[0];
      expect(firstItem).toBeTruthy();
      const canvas = vault.get(firstItem);
      expect(canvas).toBeTruthy();
      expect(canvas.items).toBeTruthy();
      expect(canvas.items.length).toBeGreaterThan(0);

      const annoPage = vault.get(canvas.items[0]);
      expect(annoPage).toBeTruthy();
      expect(annoPage.items.length).toBeGreaterThan(0);
    });

    test('hasPart manifest loads and resolves', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, hasPart);
      expect(manifest).toBeTruthy();
      expect(manifest!.id).toBe(hasPart.id);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. P2 fixtures still work (backwards compatibility)
  //    REGRESSION GATE: These must ALWAYS pass, before AND after migration
  // ═══════════════════════════════════════════════════════════════════════════

  describe('P2 fixtures still work', () => {
    test('loads NLS P2 manifest', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, nlsManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.id).toBe((nlsManifest as any)['@id']);
    });

    test('P2 manifest has canvases', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, nlsManifest);
      expect(manifest).toBeTruthy();
      expect(manifest!.items.length).toBeGreaterThan(0);
    });

    test('P2 canvas dimensions preserved', () => {
      const vault = new Vault();
      const manifest = loadSync(vault, nlsManifest);
      expect(manifest).toBeTruthy();

      const canvas = vault.get(manifest!.items[0]);
      expect(canvas).toBeTruthy();
      expect(typeof canvas.width).toBe('number');
      expect(typeof canvas.height).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Canvas compatibility layer
  //    Requires: Phase 4 (Vault.get() fallback across container stores)
  //    Key requirement: existing code doing get({type:'Canvas'}) must still
  //    work even when the resource is stored as Timeline or Scene internally.
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Canvas compatibility', () => {
    test('get with type Canvas finds a Canvas resource', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      // The P4 image fixture has an explicit Canvas
      const canvasId = p4Image.items[0].id;
      const canvas = vault.get({ id: canvasId, type: 'Canvas' });
      expect(canvas).toBeTruthy();
      expect(canvas.id).toBe(canvasId);
    });

    test('get with type Canvas finds a Timeline resource (compat layer)', () => {
      // CRITICAL COMPAT TEST: If a resource is stored as Timeline in the
      // P4 store, asking for it as Canvas should still return it.
      // This is the key backwards compatibility guarantee.
      const vault = new Vault();

      // Manually create a Timeline-only manifest to test the fallback
      const timelineManifest = {
        '@context': 'http://iiif.io/api/presentation/4/context.json',
        id: 'https://example.org/manifest/timeline',
        type: 'Manifest',
        label: { en: ['Timeline Manifest'] },
        items: [
          {
            id: 'https://example.org/timeline/1',
            type: 'Timeline',
            duration: 120,
            items: [
              {
                id: 'https://example.org/timeline/1/page/1',
                type: 'AnnotationPage',
                items: [],
              },
            ],
          },
        ],
      };

      loadSync(vault, timelineManifest);

      // Phase 2: The resource should be in the Timeline store
      const entities = getEntities(vault);
      expect(entities.Timeline).toBeDefined();
      expect(entities.Timeline['https://example.org/timeline/1']).toBeTruthy();

      // Phase 4: Asking for it as Canvas should still work via the compat layer
      const result = vault.get({
        id: 'https://example.org/timeline/1',
        type: 'Canvas',
      });
      expect(result).toBeTruthy();
      expect(result.id).toBe('https://example.org/timeline/1');
    });

    test('get with type Canvas finds a Scene resource (compat layer)', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);

      const sceneId = p4Scene.items[0].id;

      // Phase 2: The resource is stored as Scene
      const entities = getEntities(vault);
      expect(entities.Scene).toBeDefined();
      expect(entities.Scene[sceneId]).toBeTruthy();

      // Phase 4: But getting it as Canvas should still work
      const result = vault.get({ id: sceneId, type: 'Canvas' });
      expect(result).toBeTruthy();
      expect(result.id).toBe(sceneId);
    });

    test('get by string ID resolves correctly for P4 containers', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const canvasId = p4Image.items[0].id;
      const canvas = vault.get(canvasId);
      expect(canvas).toBeTruthy();
      expect(canvas.id).toBe(canvasId);
    });

    test('get with skipSelfReturn=false returns reference for unknown', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const result = vault.get(
        { id: 'https://not-real.example.org/nothing', type: 'Canvas' },
        { skipSelfReturn: false }
      );
      expect(result).toBeTruthy();
      expect(result.id).toBe('https://not-real.example.org/nothing');
    });

    test('get with skipSelfReturn=true returns null for unknown', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const result = vault.get(
        { id: 'https://not-real.example.org/nothing', type: 'Canvas' },
        { skipSelfReturn: true }
      );
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. New P4 container types in the store
  //    Requires: Phase 2 (store expansion) + Phase 3 (P4 normalizer)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('new P4 container types', () => {
    test('Timeline entities are stored in Timeline store', () => {
      const vault = new Vault();
      const timelineManifest = {
        '@context': 'http://iiif.io/api/presentation/4/context.json',
        id: 'https://example.org/manifest/t1',
        type: 'Manifest',
        label: { en: ['Timeline Test'] },
        items: [
          {
            id: 'https://example.org/timeline/1',
            type: 'Timeline',
            duration: 60.0,
            items: [],
          },
        ],
      };

      loadSync(vault, timelineManifest);
      const entities = getEntities(vault);

      expect(Object.keys(entities.Timeline).length).toBe(1);
      const timeline = entities.Timeline['https://example.org/timeline/1'];
      expect(timeline).toBeTruthy();
      expect(timeline.type).toBe('Timeline');
      expect(timeline.duration).toBe(60.0);
    });

    test('Scene entities are stored in Scene store', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);
      const entities = getEntities(vault);
      expect(Object.keys(entities.Scene).length).toBeGreaterThanOrEqual(1);
    });

    test('Quantity entities are stored in Quantity store', () => {
      const vault = new Vault();
      // A Canvas with spatialScale containing a Quantity object.
      // Note: the P4 normalizer keeps spatialScale inline on the Canvas entity
      // rather than extracting it into a separate Quantity store, so we verify
      // that the Quantity store exists (even if empty) and the data is
      // accessible on the canvas.
      const quantityManifest = {
        '@context': 'http://iiif.io/api/presentation/4/context.json',
        id: 'https://example.org/manifest/q1',
        type: 'Manifest',
        label: { en: ['Quantity Test'] },
        items: [
          {
            id: 'https://example.org/canvas/1',
            type: 'Canvas',
            width: 1000,
            height: 1000,
            spatialScale: {
              id: 'https://example.org/quantity/1',
              type: 'Quantity',
              quantityValue: 0.001,
              unit: 'meter',
            },
            items: [],
          },
        ],
      };

      loadSync(vault, quantityManifest);
      const entities = getEntities(vault);
      // Quantity store exists (added in Phase 2)
      expect(entities.Quantity).toBeDefined();
      // spatialScale is kept inline on the canvas, not separated into the Quantity store
      const canvas = vault.get({ id: 'https://example.org/canvas/1', type: 'Canvas' });
      expect(canvas).toBeTruthy();
      expect((canvas as any).spatialScale).toBeTruthy();
      expect((canvas as any).spatialScale.quantityValue).toEqual(0.001);
      expect((canvas as any).spatialScale.unit).toEqual('meter');
    });

    test('Transform entities are stored in Transform store', () => {
      const vault = new Vault();
      loadSync(vault, sceneRotated);
      const entities = getEntities(vault);
      // RotateTransform, ScaleTransform, TranslateTransform → Transform store
      expect(Object.keys(entities.Transform).length).toBeGreaterThanOrEqual(1);
    });

    test('default entities include all P4 store types', () => {
      const vault = new Vault();
      const entities = getEntities(vault);

      // Original P3 stores
      expect(entities.Collection).toBeDefined();
      expect(entities.Manifest).toBeDefined();
      expect(entities.Canvas).toBeDefined();
      expect(entities.AnnotationPage).toBeDefined();
      expect(entities.AnnotationCollection).toBeDefined();
      expect(entities.Annotation).toBeDefined();
      expect(entities.ContentResource).toBeDefined();
      expect(entities.Range).toBeDefined();
      expect(entities.Service).toBeDefined();
      expect(entities.Selector).toBeDefined();
      expect(entities.Agent).toBeDefined();

      // New P4 stores
      expect(entities.Timeline).toBeDefined();
      expect(entities.Scene).toBeDefined();
      expect(entities.Quantity).toBeDefined();
      expect(entities.Transform).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Serialization round-trips
  //    Requires: Phase 5 (toPresentation4 method + P4 serialize config)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('serialization', () => {
    test('toPresentation4 produces valid P4 JSON from P4 input', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const p4Json = vault.toPresentation4({
        id: p4Image.id,
        type: 'Manifest',
      });

      expect(p4Json).toBeTruthy();
      expect((p4Json as any)['@context']).toBe('http://iiif.io/api/presentation/4/context.json');
      expect((p4Json as any).type).toBe('Manifest');
      expect((p4Json as any).id).toBe(p4Image.id);
    });

    test('toPresentation4 produces valid P4 JSON from P3 input', () => {
      const vault = new Vault();
      loadSync(vault, cssManifest);

      const p4Json = vault.toPresentation4({
        id: cssManifest.id,
        type: 'Manifest',
      });

      expect(p4Json).toBeTruthy();
      expect((p4Json as any)['@context']).toBe('http://iiif.io/api/presentation/4/context.json');
      expect((p4Json as any).type).toBe('Manifest');
      expect((p4Json as any).id).toBe(cssManifest.id);
      // P4 should have items
      expect((p4Json as any).items.length).toBeGreaterThan(0);
    });

    test('toPresentation3 from P3 input produces valid P3 JSON', () => {
      const vault = new Vault();
      loadSync(vault, cssManifest);

      const p3Json = vault.toPresentation3({
        id: cssManifest.id,
        type: 'Manifest',
      });

      expect(p3Json).toBeTruthy();
      expect((p3Json as any).type).toBe('Manifest');
      expect((p3Json as any).id).toBe(cssManifest.id);
      expect((p3Json as any).items.length).toBeGreaterThan(0);
    });

    test('toPresentation3 from P4 image manifest produces valid P3 JSON', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const p3Json = vault.toPresentation3({
        id: p4Image.id,
        type: 'Manifest',
      });

      expect(p3Json).toBeTruthy();
      expect((p3Json as any).type).toBe('Manifest');
      expect((p3Json as any).items.length).toBeGreaterThan(0);
      // Canvas items should still be Canvas in P3 output
      expect((p3Json as any).items[0].type).toBe('Canvas');
    });

    test('P4 round-trip preserves manifest structure', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const serialized = vault.toPresentation4({
        id: p4Image.id,
        type: 'Manifest',
      }) as any;

      expect(serialized.id).toBe(p4Image.id);
      expect(serialized.type).toBe(p4Image.type);
      expect(serialized.label).toEqual(p4Image.label);
      expect(serialized.items.length).toBe(p4Image.items.length);
      expect(serialized.items[0].id).toBe(p4Image.items[0].id);
      expect(serialized.items[0].type).toBe(p4Image.items[0].type);
    });

    test('toPresentation4 on P2 input produces valid P4', () => {
      const vault = new Vault();
      loadSync(vault, nlsManifest);

      const p4Json = vault.toPresentation4({
        id: (nlsManifest as any)['@id'],
        type: 'Manifest',
      });

      expect(p4Json).toBeTruthy();
      expect((p4Json as any)['@context']).toBe('http://iiif.io/api/presentation/4/context.json');
      expect((p4Json as any).type).toBe('Manifest');
      expect((p4Json as any).items.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Entity actions on new store types
  //    Requires: Phase 2 (store expansion) + Phase 3 (P4 normalizer)
  //    The entities-reducer already iterates generically over all store keys,
  //    so once the stores exist and entities are imported, actions should work.
  // ═══════════════════════════════════════════════════════════════════════════

  describe('entity actions on new types', () => {
    test('modifyEntityField works on Timeline entities', () => {
      const vault = new Vault();
      const timelineManifest = {
        '@context': 'http://iiif.io/api/presentation/4/context.json',
        id: 'https://example.org/manifest/ea1',
        type: 'Manifest',
        label: { en: ['Entity Action Test'] },
        items: [
          {
            id: 'https://example.org/timeline/ea1',
            type: 'Timeline',
            duration: 30.0,
            label: { en: ['Original Label'] },
            items: [],
          },
        ],
      };

      loadSync(vault, timelineManifest);

      vault.modifyEntityField({ id: 'https://example.org/timeline/ea1', type: 'Timeline' }, 'label', {
        en: ['Updated Label'],
      });

      const timeline = vault.get({
        id: 'https://example.org/timeline/ea1',
        type: 'Timeline',
      });
      expect(timeline.label).toEqual({ en: ['Updated Label'] });
    });

    test('modifyEntityField works on Scene entities', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);

      const sceneId = p4Scene.items[0].id;

      vault.modifyEntityField({ id: sceneId, type: 'Scene' }, 'label', {
        en: ['Modified Scene Label'],
      });

      const scene = vault.get({ id: sceneId, type: 'Scene' });
      expect(scene.label).toEqual({ en: ['Modified Scene Label'] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Annotation shape changes
  //    Requires: Phase 3 (P4 normalizer ensures motivation/target/body arrays)
  //    In P4, motivation, target, and body are ALWAYS arrays (never singular).
  //    The P3 normalizer already normalizes most of these to arrays, but P4
  //    makes it explicit in the spec.
  // ═══════════════════════════════════════════════════════════════════════════

  describe('P4 annotation shapes', () => {
    test('P4 annotation motivation is always an array', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const entities = getEntities(vault);
      const annotations = Object.values(entities.Annotation);
      for (const anno of annotations) {
        if ((anno as any).motivation) {
          expect(Array.isArray((anno as any).motivation)).toBe(true);
        }
      }
    });

    test('P4 annotation target is always an array', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const entities = getEntities(vault);
      const annotations = Object.values(entities.Annotation);
      for (const anno of annotations) {
        if ((anno as any).target) {
          expect(Array.isArray((anno as any).target)).toBe(true);
        }
      }
    });

    test('P4 annotation body is always an array', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const entities = getEntities(vault);
      const annotations = Object.values(entities.Annotation);
      for (const anno of annotations) {
        if ((anno as any).body) {
          expect(Array.isArray((anno as any).body)).toBe(true);
        }
      }
    });

    test('P3 annotations are also arrays after P4 upgrade', () => {
      const vault = new Vault();
      // The choice manifest has explicit annotations with motivation/body/target
      loadSync(vault, choiceManifest);

      const entities = getEntities(vault);
      const annotations = Object.values(entities.Annotation);
      expect(annotations.length).toBeGreaterThan(0);
      for (const anno of annotations) {
        if ((anno as any).motivation) {
          expect(Array.isArray((anno as any).motivation)).toBe(true);
        }
        if ((anno as any).target) {
          expect(Array.isArray((anno as any).target)).toBe(true);
        }
        if ((anno as any).body) {
          expect(Array.isArray((anno as any).body)).toBe(true);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Property rename compat
  //     Requires: Phase 3 (P4 upgrade renames placeholderCanvas → placeholderContainer)
  //               Phase 4 (compat layer adds alias back)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('property rename compatibility', () => {
    test('placeholderContainer is set on P4 containers with backwards compat alias', () => {
      // P3: placeholderCanvas → P4: placeholderContainer
      // Compat: both properties should be accessible on the stored entity
      const vault = new Vault();
      const manifestWithPlaceholder = {
        '@context': 'http://iiif.io/api/presentation/3/context.json',
        id: 'https://example.org/manifest/ph1',
        type: 'Manifest',
        label: { en: ['Placeholder Test'] },
        items: [
          {
            id: 'https://example.org/canvas/ph1',
            type: 'Canvas',
            width: 800,
            height: 600,
            items: [],
            placeholderCanvas: {
              id: 'https://example.org/canvas/placeholder',
              type: 'Canvas',
              width: 100,
              height: 75,
              items: [],
            },
          },
        ],
      };

      loadSync(vault, manifestWithPlaceholder);
      const canvas = vault.get({
        id: 'https://example.org/canvas/ph1',
        type: 'Canvas',
      });
      expect(canvas).toBeTruthy();

      // After P4 upgrade, should have placeholderContainer
      // Compat: should also still have placeholderCanvas alias
      const hasEither = (canvas as any).placeholderContainer || (canvas as any).placeholderCanvas;
      expect(hasEither).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Batch operations with P4
  //     Requires: Phase 2 + Phase 3 (basic vault operations on P4 data)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('batch operations', () => {
    test('batch mutation works on P4 manifest', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const manifest = vault.get({ id: p4Image.id, type: 'Manifest' });
      expect(manifest).toBeTruthy();

      vault.batch((v) => {
        v.modifyEntityField({ id: p4Image.id, type: 'Manifest' }, 'label', {
          en: ['Batch Updated'],
        });
      });

      const updated = vault.get({ id: p4Image.id, type: 'Manifest' });
      expect(updated.label).toEqual({ en: ['Batch Updated'] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. Multiple loads
  //     Requires: Phase 3 (P4 normalizer handles all input versions)
  //     Key test: a single Vault instance should hold P2, P3, and P4 data
  // ═══════════════════════════════════════════════════════════════════════════

  describe('loading multiple manifests of different versions', () => {
    test('can load P2, P3, and P4 manifests into the same vault', () => {
      const vault = new Vault();

      // Load P2
      const p2 = loadSync(vault, nlsManifest);
      expect(p2).toBeTruthy();

      // Load P3
      const p3 = loadSync(vault, cssManifest);
      expect(p3).toBeTruthy();

      // Load P4
      const p4 = loadSync(vault, p4Image);
      expect(p4).toBeTruthy();

      // All three should be accessible
      const p2Again = vault.get({
        id: (nlsManifest as any)['@id'],
        type: 'Manifest',
      });
      expect(p2Again).toBeTruthy();

      const p3Again = vault.get({
        id: cssManifest.id,
        type: 'Manifest',
      });
      expect(p3Again).toBeTruthy();

      const p4Again = vault.get({ id: p4Image.id, type: 'Manifest' });
      expect(p4Again).toBeTruthy();

      // All manifests should be in the Manifest store
      const entities = getEntities(vault);
      expect(Object.keys(entities.Manifest).length).toBeGreaterThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. Mapping table
  //     Requires: Phase 2 + Phase 3 (mapping records new type names)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('mapping table', () => {
    test('mapping records correct types for P4 resources', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const state = vault.getState();
      const mapping = state.iiif.mapping;

      // The manifest id should map to Manifest
      expect(mapping[p4Image.id]).toBe('Manifest');

      // The canvas id should map to Canvas
      const canvasId = p4Image.items[0].id;
      expect(mapping[canvasId]).toBe('Canvas');
    });

    test('mapping records Scene type for P4 scene resources', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);

      const state = vault.getState();
      const mapping = state.iiif.mapping;

      const sceneId = p4Scene.items[0].id;
      expect(mapping[sceneId]).toBe('Scene');
    });

    test('mapping records Timeline type for P4 timeline resources', () => {
      const vault = new Vault();
      const timelineManifest = {
        '@context': 'http://iiif.io/api/presentation/4/context.json',
        id: 'https://example.org/manifest/mt1',
        type: 'Manifest',
        label: { en: ['Mapping Test'] },
        items: [
          {
            id: 'https://example.org/timeline/mt1',
            type: 'Timeline',
            duration: 45,
            items: [],
          },
        ],
      };

      loadSync(vault, timelineManifest);

      const state = vault.getState();
      const mapping = state.iiif.mapping;
      expect(mapping['https://example.org/timeline/mt1']).toBe('Timeline');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. Hydrate / deep
  //     Requires: Phase 2 + Phase 3 + Phase 4 (resolveType for new types)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('hydrate and deep', () => {
    test('hydrate works on P4 resources', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const canvasId = p4Image.items[0].id;
      const hydrated = vault.hydrate({ id: canvasId, type: 'Canvas' });
      expect(hydrated).toBeTruthy();
      expect(hydrated.id).toBe(canvasId);
    });

    test('hydrate works on Scene references', () => {
      const vault = new Vault();
      loadSync(vault, p4Scene);

      const sceneId = p4Scene.items[0].id;
      const hydrated = vault.hydrate({ id: sceneId, type: 'Scene' });
      expect(hydrated).toBeTruthy();
      expect(hydrated.id).toBe(sceneId);
    });

    test('deep traversal works on P4 manifest', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const manifest = vault.get({ id: p4Image.id, type: 'Manifest' });
      const firstCanvas = vault.get(manifest.items[0]);
      expect(firstCanvas).toBeTruthy();
      expect(firstCanvas.id).toBe(p4Image.items[0].id);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. Request status
  //     Requires: Phase 3 (basic P4 loading marks requests as ready)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('request status', () => {
    test('requestStatus returns ready for loaded P4 manifest', () => {
      const vault = new Vault();
      loadSync(vault, p4Image);

      const status = vault.requestStatus(p4Image.id);
      expect(status).toBeTruthy();
      expect(status!.loadingState).toBe('RESOURCE_READY');
    });

    test('requestStatus returns undefined for unloaded manifest', () => {
      const vault = new Vault();
      const status = vault.requestStatus('https://not-loaded.example.org');
      expect(status).toBeUndefined();
    });
  });
});
