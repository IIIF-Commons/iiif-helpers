export type Point2D = readonly [number, number, ...number[]];

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isRectangle(points: readonly Point2D[]): boolean {
  const vertices =
    points.length === 5 && points[0][0] === points[4][0] && points[0][1] === points[4][1]
      ? points.slice(0, -1)
      : points;
  if (vertices.length !== 4 || vertices.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return false;
  }

  const xs = [...new Set(vertices.map(([x]) => x))];
  const ys = [...new Set(vertices.map(([, y]) => y))];
  if (xs.length !== 2 || ys.length !== 2 || xs[0] === xs[1] || ys[0] === ys[1]) {
    return false;
  }

  const corners = new Set(vertices.map(([x, y]) => `${x}\0${y}`));
  return (
    corners.size === 4 &&
    vertices.every(([x, y], index) => {
      const [nextX, nextY] = vertices[(index + 1) % vertices.length];
      return x === nextX || y === nextY;
    })
  );
}

export function polygonToBoundingBox<T extends { points: readonly Point2D[] }>(
  polygon: T | null
): BoundingBox | null {
  if (!polygon || polygon.points.length < 3) {
    return null;
  }
  const coordinates = polygon.points.flatMap(([x, y]) => [x, y]);
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return null;
  }
  const xs = polygon.points.map(([x]) => x);
  const ys = polygon.points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(...xs) - x,
    height: Math.max(...ys) - y,
  };
}
