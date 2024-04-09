/** Code to "flatten" quadratic and cubic Bézier curves to polylines.
 *
 * All code in this module is based on JavaScript code by Raph Levien, published on his blog at
 * https://raphlinus.github.io/.
 * I merely changed the structure a bit, removed some unneeded parts and added some comments and type hints.
 *
 * Flattening of quadratic Bézier curves:
 * - Article: https://raphlinus.github.io/graphics/curves/2019/12/23/flatten-quadbez.html
 * - Code: https://github.com/raphlinus/raphlinus.github.io/blob/master/_posts/2019-12-23-flatten-quadbez.md?plain=1#L73-L212
 *
 * Flattening of cubic Bézier curves: https://levien.com/tmp/flatten.html
 *
 * Note that the code in this module has a different license than the rest of the package,
 * due to the inclusion of Apache-licensed third party code.
 *
 * @license
 * Copyright 2022 Johannes Baiter <johannes.baiter@gmail.com>
 * Copyright 2019, 2022 Raph Levien <raph.levien@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export type Point = { x: number; y: number };

export function flattenQuadraticBezier(start: Point, control: Point, end: Point, tolerance = 1): Point[] {
  return new QuadraticBezier(start, control, end).subdivide(tolerance);
}

export function flattenCubicBezier(
  start: Point,
  startControl: Point,
  end: Point,
  endControl: Point,
  tolerance = 1
): Point[] {
  return new CubicBezier(
    new Float64Array([start.x, start.y, startControl.x, startControl.y, end.x, end.y, endControl.x, endControl.y])
  ).subdivide(tolerance) as Point[];
}

function hypot2(p: Point): number {
  return p.x * p.x + p.y * p.y;
}

// Compute an approximation to int (1 + 4x^2) ^ -0.25 dx
function approx_myint(x: number): number {
  const d = 0.67;
  return x / (1 - d + Math.pow(Math.pow(d, 4) + 0.25 * x * x, 0.25));
}

// Approximate the inverse of `approx_myint`
function approx_inv_myint(x: number): number {
  const b = 0.39;
  return x * (1 - b + Math.sqrt(b * b + 0.25 * x * x));
}

// Parameters for a basic parabola corresponding to a quadratic bézier curve
type QuadraticBezierBasicParams = {
  x0: number;
  x2: number;
  scale: number;
  cross: number;
};

class QuadraticBezier {
  start: Point;
  control: Point;
  end: Point;

  constructor(start: Point, control: Point, end: Point) {
    this.start = start;
    this.control = control;
    this.end = end;
  }

  eval(t: number): Point {
    const mt = 1 - t;
    return {
      x: this.start.x * mt * mt + 2 * this.control.x * mt * t + this.end.x * t * t,
      y: this.start.y * mt * mt + 2 * this.control.y * mt * t + this.end.y * t * t,
    };
  }

  mapToBasic(): QuadraticBezierBasicParams {
    const { x: x0, y: y0 } = this.start;
    const { x: x1, y: y1 } = this.control;
    const { x: x2, y: y2 } = this.end;

    // Determine the x values and scaling to map to y=x^2
    const ddx = 2 * x1 - x0 - x2;
    const ddy = 2 * y1 - y0 - y2;
    const u0 = (x1 - x0) * ddx + (y1 - y0) * ddy;
    const u2 = (x2 - x1) * ddx + (y2 - y1) * ddy;
    const cross = (x2 - x0) * ddy - (y2 - y0) * ddx;
    const paramX0 = u0 / cross;
    const paramX2 = u2 / cross;

    // There's probably a more elegant formulation of this...
    const scale = Math.abs(cross) / (Math.hypot(ddx, ddy) * Math.abs(paramX2 - paramX0));

    return { x0, x2, scale, cross };
  }

  subdivide(tolerance: number): Point[] {
    const params = this.mapToBasic();
    const a0 = approx_myint(params.x0);
    const a2 = approx_myint(params.x2);
    const count = 0.5 * Math.abs(a2 - a0) * Math.sqrt(params.scale / tolerance);
    const n = Math.ceil(count);
    const u0 = approx_inv_myint(a0);
    const u2 = approx_inv_myint(a2);
    const tValues = [0];
    for (let i = 1; i < n; i++) {
      const u = approx_inv_myint(a0 + ((a2 - a0) * i) / n);
      const t = (u - u0) / (u2 - u0);
      tValues.push(t);
    }
    tValues.push(1);
    return tValues.map((t) => this.eval(t));
  }
}

class CubicBezier {
  private c: Float64Array;

  /// Argument is array of coordinate values [x0, y0, x1, y1, x2, y2, x3, y3].
  constructor(coords: Float64Array) {
    this.c = coords;
  }

  weightsum(c0: number, c1: number, c2: number, c3: number): Point {
    const x = c0 * this.c[0] + c1 * this.c[2] + c2 * this.c[4] + c3 * this.c[6];
    const y = c0 * this.c[1] + c1 * this.c[3] + c2 * this.c[5] + c3 * this.c[7];
    return { x, y };
  }

  eval(t: number): Point {
    const mt = 1 - t;
    const c0 = mt * mt * mt;
    const c1 = 3 * mt * mt * t;
    const c2 = 3 * mt * t * t;
    const c3 = t * t * t;
    return this.weightsum(c0, c1, c2, c3);
  }

  deriv(t: number): Point {
    const mt = 1 - t;
    const c0 = -3 * mt * mt;
    const c3 = 3 * t * t;
    const c1 = -6 * t * mt - c0;
    const c2 = 6 * t * mt - c3;
    return this.weightsum(c0, c1, c2, c3);
  }

  // quadratic bezier with matching endpoints and minimum max vector error
  midpoint_quadbez(): QuadraticBezier {
    const p1 = this.weightsum(-0.25, 0.75, 0.75, -0.25);
    return new QuadraticBezier({ x: this.c[0], y: this.c[1] }, p1, { x: this.c[6], y: this.c[7] });
  }

  subsegment(t0: number, t1: number): CubicBezier {
    const c = new Float64Array(8);
    const p0 = this.eval(t0);
    const p3 = this.eval(t1);
    c[0] = p0.x;
    c[1] = p0.y;
    const scale = (t1 - t0) / 3;
    const d1 = this.deriv(t0);
    c[2] = p0.x + scale * d1.x;
    c[3] = p0.y + scale * d1.y;
    const d2 = this.deriv(t1);
    c[4] = p3.x - scale * d2.x;
    c[5] = p3.y - scale * d2.y;
    c[6] = p3.x;
    c[7] = p3.y;
    return new CubicBezier(c);
  }

  // Very fancy subdivision scheme
  subdivide(tol: number) {
    const tol1 = 0.1 * tol; // error for subdivision into quads
    const tol2 = tol - tol1; // error for subdivision of quads into lines
    const sqrt_tol2 = Math.sqrt(tol2);
    const err2 = hypot2(this.weightsum(1, -3, 3, -1));
    const n_quads = Math.ceil(Math.pow(err2 / (432 * tol1 * tol1), 1 / 6));
    const quads = [];
    let sum = 0;
    for (let i = 0; i < n_quads; i++) {
      const t0 = i / n_quads;
      const t1 = (i + 1) / n_quads;
      const quad = this.subsegment(t0, t1).midpoint_quadbez();
      const params = quad.mapToBasic();
      const a0 = approx_myint(params.x0);
      const a2 = approx_myint(params.x2);
      const scale = Math.sqrt(params.scale);
      let val = Math.abs(a2 - a0) * scale;
      if (Math.sign(params.x0) != Math.sign(params.x2)) {
        // min x value in basic parabola to make sure we don't skip cusp
        const xmin = sqrt_tol2 / scale;
        const cusp_val = (sqrt_tol2 * Math.abs(a2 - a0)) / approx_myint(xmin);
        // I *think* it will always be larger, but just in case...
        val = Math.max(val, cusp_val);
      }
      quads.push({
        quad: quad,
        a0: a0,
        a2: a2,
        val: val,
      });
      sum += val;
    }
    const count = (0.5 * sum) / sqrt_tol2;
    const n = Math.ceil(count);
    const result = [{ x: this.c[0], y: this.c[1] }];
    let val = 0; // sum of vals from [0..i]
    let i = 0;
    for (let j = 1; j < n; j++) {
      const target = (sum * j) / n;
      while (val + quads[i].val < target) {
        val += quads[i].val;
        i++;
      }
      const a0 = quads[i].a0;
      const a2 = quads[i].a2;
      // Note: we can cut down on recomputing these
      const u0 = approx_inv_myint(a0);
      const u2 = approx_inv_myint(a2);
      const a = a0 + ((a2 - a0) * (target - val)) / quads[i].val;
      const u = approx_inv_myint(a);
      const t = (u - u0) / (u2 - u0);
      result.push(quads[i].quad.eval(t));
    }
    result.push({ x: this.c[6], y: this.c[7] });
    return result;
  }
}
