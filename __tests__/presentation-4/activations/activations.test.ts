import { describe, expect, test } from 'vitest';
import commentsWithCameras from '../fixtures/official-3d/uc08_3d_comments_with_cameras.json';
import { createActivationsHelper } from '../../../src/activations';
import { Vault4 } from '../../../src/vault/vault4';

describe('optional Presentation 4 Activation helpers', () => {
  test('finds and parses the pinned activating annotation as an ordered transaction', () => {
    const vault = new Vault4();
    vault.loadManifestSync(commentsWithCameras.id, commentsWithCameras);
    const helper = createActivationsHelper(vault);

    const annotations = helper.getAllActivatingAnnotations(commentsWithCameras.id);
    expect(annotations.map(({ id }) => id)).toEqual(['https://iiif.io/api/presentation/4.0/example/uc08/3d/anno9']);

    const transaction = helper.parseActivatingAnnotation(annotations[0]);
    expect(transaction).toMatchObject({
      annotationId: 'https://iiif.io/api/presentation/4.0/example/uc08/3d/anno9',
      steps: [
        {
          source: {
            id: 'https://iiif.io/api/presentation/4.0/example/uc08/3d/anno-that-paints-desired-camera-to-view-tooth',
            type: 'Annotation',
          },
          selector: null,
          transform: [],
          actions: ['show', 'enable', 'select'],
        },
      ],
    });
  });
});
