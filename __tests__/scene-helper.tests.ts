import type { SceneNormalized } from '@iiif/parser/presentation-4-normalized/types';
import { describe, expect, test } from 'vitest';
import modelInScene from '../fixtures/presentation-4/scenes/01-model-in-scene.json';
import rotatedModel from '../fixtures/presentation-4/scenes/14-rotated-model.json';
import { createSceneHelper, KNOWN_SCENE_PAINTABLE_TYPES } from '../src/scenes';
import { VaultAuto } from '../src/vault/vault-auto';

describe('scene helper', () => {
  test('Extracting model paintables from a Scene', () => {
    const vault = new VaultAuto({ enablePresentation4: true });
    vault.loadManifestSync(modelInScene.id, modelInScene);

    const manifest = vault.get<{ type?: string; items: Array<{ id: string }> }>(modelInScene.id);
    if (!manifest) {
      throw new Error('Manifest was not loaded');
    }
    const sceneId = manifest.items[0].id;

    const helper = createSceneHelper(vault);
    const paintables = helper.getPaintables(sceneId);

    expect(paintables.items).toHaveLength(1);
    expect(paintables.items[0].type).toBe('model');
    expect(paintables.items[0].resource.id).toBe(
      'https://raw.githubusercontent.com/IIIF/3d/main/assets/astronaut/astronaut.glb'
    );
    expect(paintables.items[0].target?.source?.type).toBe('Scene');
  });

  test('Extracting transforms and 3D target PointSelector', () => {
    const vault = new VaultAuto({ enablePresentation4: true });
    vault.loadManifestSync(rotatedModel.id, rotatedModel);

    const manifest = vault.get<{ type?: string; items: Array<{ id: string }> }>(rotatedModel.id);
    if (!manifest) {
      throw new Error('Manifest was not loaded');
    }
    const sceneId = manifest.items[0].id;
    const scene = vault.get<SceneNormalized>(sceneId);
    if (!scene) {
      throw new Error('Scene was not loaded');
    }

    const helper = createSceneHelper(vault);
    const paintables = helper.getPaintables(sceneId);

    expect(paintables.items).toHaveLength(1);
    expect(paintables.items[0].type).toBe('model');
    expect(paintables.items[0].bodyTransform).toEqual([
      {
        type: 'RotateTransform',
        x: 0,
        y: 180,
        z: 0,
      },
    ]);

    const target = paintables.items[0].target;
    if (!target?.selector || target.selector.type !== 'PointSelector') {
      throw new Error('Expected PointSelector target');
    }
    expect(target.selector.type).toBe('PointSelector');
    expect(target.selector.spatial).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('Includes available paintable type catalog and marks unknown resource types', () => {
    const manifest = {
      id: 'https://example.org/manifest',
      type: 'Manifest',
      items: [
        {
          id: 'https://example.org/scene/1',
          type: 'Scene',
          items: [
            {
              id: 'https://example.org/scene/1/page/1',
              type: 'AnnotationPage',
              items: [
                {
                  id: 'https://example.org/scene/1/anno/1',
                  type: 'Annotation',
                  motivation: ['painting'],
                  body: {
                    id: 'https://example.org/resource/custom',
                    type: 'CustomMesh',
                  },
                  target: { id: 'https://example.org/scene/1', type: 'Scene' },
                },
              ],
            },
          ],
        },
      ],
    };

    const vault = new VaultAuto({ enablePresentation4: true });
    vault.loadManifestSync(manifest.id, manifest);

    const helper = createSceneHelper(vault);
    const paintables = helper.getPaintables('https://example.org/scene/1');

    expect(paintables.availableTypes).toEqual(KNOWN_SCENE_PAINTABLE_TYPES);
    expect(paintables.items).toHaveLength(1);
    expect(paintables.items[0].type).toBe('unknown');
    expect(paintables.items[0].rawType).toBe('CustomMesh');
    expect(paintables.types).toEqual(['unknown']);
    expect(paintables.rawTypes).toEqual(['CustomMesh']);
  });
});
