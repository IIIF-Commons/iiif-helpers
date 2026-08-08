import type { Transform } from '@iiif/parser/presentation-4/types';

export type MatrixTuple = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

const identity = (): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// Column-major multiplication, matching WebGL and THREE.Matrix4.fromArray().
function multiply(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let index = 0; index < 4; index++) {
        out[column * 4 + row] += a[index * 4 + row] * b[column * 4 + index];
      }
    }
  }
  return out;
}

const translate = (x = 0, y = 0, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const scale = (x = 1, y = 1, z = 1) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
const rotateX = (r: number) => [1, 0, 0, 0, 0, Math.cos(r), Math.sin(r), 0, 0, -Math.sin(r), Math.cos(r), 0, 0, 0, 0, 1];
const rotateY = (r: number) => [Math.cos(r), 0, -Math.sin(r), 0, 0, 1, 0, 0, Math.sin(r), 0, Math.cos(r), 0, 0, 0, 0, 1];
const rotateZ = (r: number) => [Math.cos(r), Math.sin(r), 0, 0, -Math.sin(r), Math.cos(r), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function createSceneTransformMatrix(
  transforms: readonly Transform[],
  targetPoint: readonly [number, number, number] = [0, 0, 0]
): MatrixTuple {
  let matrix = identity();
  for (const transform of transforms) {
    if (transform.type === 'TranslateTransform') {
      matrix = multiply(translate(transform.x, transform.y, transform.z), matrix);
    } else if (transform.type === 'ScaleTransform') {
      matrix = multiply(scale(transform.x, transform.y, transform.z), matrix);
    } else if (transform.type === 'RotateTransform') {
      const radians = Math.PI / 180;
      const rotation = multiply(
        rotateZ((transform.z || 0) * radians),
        multiply(rotateY((transform.y || 0) * radians), rotateX((transform.x || 0) * radians))
      );
      matrix = multiply(rotation, matrix);
    }
  }
  return multiply(translate(...targetPoint), matrix) as unknown as MatrixTuple;
}
