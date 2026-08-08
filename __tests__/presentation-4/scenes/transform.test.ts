import { describe, expect, test } from 'vitest';
import { createSceneTransformMatrix, type MatrixTuple } from '../../../src/scenes';

function point(matrix: MatrixTuple, [x, y, z]: [number, number, number]) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ].map((value) => Math.round(value * 1e10) / 1e10);
}

describe('Presentation 4 ordered transforms', () => {
  test('applies repeated transforms in document order before target placement', () => {
    const matrix = createSceneTransformMatrix(
      [
        { type: 'TranslateTransform', x: 1 },
        { type: 'ScaleTransform', x: 2, y: 3, z: 4 },
        { type: 'TranslateTransform', x: 5 },
      ],
      [10, 0, 0]
    );
    expect(point(matrix, [0, 0, 0])).toEqual([17, 0, 0]);
  });

  test('uses right-handed X then Y then Z Euler rotations in degrees', () => {
    const matrix = createSceneTransformMatrix([{ type: 'RotateTransform', x: 90, y: 90, z: 0 }]);
    expect(point(matrix, [0, 1, 0])).toEqual([1, 0, 0]);
  });

  test('defaults missing axes and preserves reflections', () => {
    const matrix = createSceneTransformMatrix([{ type: 'ScaleTransform', x: -1 }]);
    expect(point(matrix, [2, 3, 4])).toEqual([-2, 3, 4]);
  });
});
