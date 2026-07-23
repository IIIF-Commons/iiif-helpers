import { describe, expect, test } from 'vitest';
import { expandTarget, expandTargets, resolveAnnotationValues } from '../../../src';

describe('annotation aggregate values', () => {
  test('preserves aggregate kind and order while exposing SpecificResource sources', () => {
    const values = {
      type: 'Independents',
      items: [
        {
          type: 'Choice',
          items: [
            {
              type: 'SpecificResource',
              source: { id: 'https://example.org/canvas/choice-1', type: 'Canvas' },
            },
            { id: 'https://example.org/canvas/choice-2', type: 'Canvas' },
          ],
        },
        {
          type: 'Composite',
          items: [
            {
              type: 'List',
              items: [
                { id: 'https://example.org/canvas/list-1', type: 'Canvas' },
                { id: 'https://example.org/canvas/list-2', type: 'Canvas' },
              ],
            },
          ],
        },
      ],
    };
    const original = structuredClone(values);

    const resolved = resolveAnnotationValues(values);

    expect(resolved.map(({ value }) => (value as { id: string }).id)).toEqual([
      'https://example.org/canvas/choice-1',
      'https://example.org/canvas/choice-2',
      'https://example.org/canvas/list-1',
      'https://example.org/canvas/list-2',
    ]);
    expect(resolved.map(({ aggregatePath }) => aggregatePath)).toEqual([
      [
        { type: 'Independents', index: 0 },
        { type: 'Choice', index: 0 },
      ],
      [
        { type: 'Independents', index: 0 },
        { type: 'Choice', index: 1 },
      ],
      [
        { type: 'Independents', index: 1 },
        { type: 'Composite', index: 0 },
        { type: 'List', index: 0 },
      ],
      [
        { type: 'Independents', index: 1 },
        { type: 'Composite', index: 0 },
        { type: 'List', index: 1 },
      ],
    ]);
    expect(resolved.map(({ specificResources }) => specificResources.length)).toEqual([1, 0, 0, 0]);
    expect(values).toEqual(original);
  });

  test('expands every aggregate target and keeps expandTarget as the first-result API', () => {
    const target = {
      type: 'Choice',
      items: [
        {
          type: 'SpecificResource',
          source: {
            id: 'https://example.org/canvas/1',
            type: 'Canvas',
            partOf: 'https://example.org/manifest',
          },
          selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
        },
        'https://example.org/canvas/2#t=5,10',
      ],
    };
    const original = structuredClone(target);

    const expanded = expandTargets(target as never);

    expect(expanded.map(({ target: item }) => item.source.id)).toEqual([
      'https://example.org/canvas/1',
      'https://example.org/canvas/2',
    ]);
    expect(expanded.map(({ aggregatePath }) => aggregatePath)).toEqual([
      [{ type: 'Choice', index: 0 }],
      [{ type: 'Choice', index: 1 }],
    ]);
    expect(expanded[0].target.selector).toMatchObject({
      type: 'BoxSelector',
      spatial: { x: 1, y: 2, width: 3, height: 4 },
    });
    expect(expanded[1].target.selector).toMatchObject({
      type: 'TemporalSelector',
      temporal: { startTime: 5, endTime: 10 },
    });
    expect(expandTarget(target as never)).toEqual(expanded[0].target);
    expect(target).toEqual(original);
  });
});
