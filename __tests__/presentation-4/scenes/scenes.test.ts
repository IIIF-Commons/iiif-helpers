import type { SceneNormalized } from '@iiif/parser/presentation-4-normalized/types';
import { describe, expect, test } from 'vitest';
import modelInScene from '../fixtures/official-3d/04_scene.json';
import commentsWithCameras from '../fixtures/official-3d/uc08_3d_comments_with_cameras.json';
import { createSceneHelper, KNOWN_SCENE_PAINTABLE_TYPES } from '../../../src/scenes';
import { Vault4 } from '../../../src/vault/vault4';

function loadScene(fixture: { id: string; items: Array<{ id: string }> }) {
  const vault = new Vault4();
  vault.loadManifestSync(fixture.id, fixture);
  const scene = vault.get<SceneNormalized>(fixture.items[0].id);
  if (!scene) throw new Error('Scene was not loaded');
  return { vault, scene };
}

describe('optional Presentation 4 Scene helpers', () => {
  test('extracts a Model paintable from the pinned simplest Scene', () => {
    const { vault, scene } = loadScene(modelInScene);
    const paintables = createSceneHelper(vault).getPaintables(scene);

    expect(paintables.availableTypes).toEqual(['model']);
    expect(paintables.availableTypes).toEqual(KNOWN_SCENE_PAINTABLE_TYPES);
    expect(paintables.items).toHaveLength(1);
    expect(paintables.items[0]).toMatchObject({
      type: 'model',
      rawType: 'Model',
      resource: {
        id: 'https://raw.githubusercontent.com/IIIF/3d/main/assets/astronaut/astronaut.glb',
        type: 'Model',
      },
      target: {
        source: {
          id: 'https://iiif.io/api/presentation/4.0/example/scene/1',
          type: 'Scene',
        },
      },
    });
  });

  test('preserves ordered transforms, a PointSelector, and unsupported raw types', () => {
    const { vault, scene } = loadScene(commentsWithCameras);
    const paintables = createSceneHelper(vault).getPaintables(scene);
    const mandible = paintables.items.find(
      ({ resource }) => resource.id === 'https://fixtures.iiif.io/3d/smithsonian/whale/whale_mandible.glb'
    );
    const camera = paintables.items.find(({ rawType }) => rawType === 'PerspectiveCamera');

    expect(mandible?.type).toBe('model');
    expect(mandible?.bodyTransform).toEqual([
      { type: 'ScaleTransform', x: 10, y: 10, z: 10 },
      { type: 'RotateTransform', x: 12.5, y: 0, z: 0 },
      { type: 'TranslateTransform', x: 0, y: 0, z: 0.5 },
    ]);

    expect(camera?.type).toBe('unknown');
    expect(camera?.rawType).toBe('PerspectiveCamera');
    expect(camera?.target?.selector).toMatchObject({
      type: 'PointSelector',
      spatial: { x: 0, y: 0.15, z: 0.75 },
    });
    expect(paintables.types).toEqual(['model', 'unknown']);
    expect(paintables.rawTypes).toEqual(['Model', 'PerspectiveCamera']);
  });
});
