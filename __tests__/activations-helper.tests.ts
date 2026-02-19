import { describe, expect, test } from 'vitest';
import { createActivationsHelper } from '../src/activations';
import { compatVault } from '../src/compat';
import type { SceneAnnotation } from '../src/scenes/types';

describe('activations helper', () => {
  test('Parsing an activating annotation into an ordered transaction', () => {
    const helper = createActivationsHelper(compatVault);

    const activating: SceneAnnotation = {
      id: 'https://example.org/anno/1',
      type: 'Annotation',
      motivation: ['activating'],
      body: {
        type: 'SpecificResource',
        source: { id: 'https://example.org/model/1', type: 'Model' },
        selector: [{ type: 'AnimationSelector', value: 'open' }],
        transform: [{ type: 'RotateTransform', y: 90 }],
        action: ['play'],
      },
      target: { id: 'https://example.org/scene/1', type: 'Scene' },
    };

    const parsed = helper.parseActivatingAnnotation(activating);
    if (!parsed) {
      throw new Error('Expected parsed activation transaction');
    }
    expect(parsed?.annotationId).toBe('https://example.org/anno/1');
    expect(parsed?.steps).toHaveLength(1);
    expect(parsed?.steps[0].source?.type).toBe('Model');
    expect(parsed?.steps[0].transform).toEqual([{ type: 'RotateTransform', y: 90 }]);
    expect(parsed?.steps[0].actions).toEqual(['play']);
  });
});
