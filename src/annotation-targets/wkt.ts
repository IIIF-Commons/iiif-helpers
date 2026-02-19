export type WktPoint = {
  type: 'Point';
  coordinates: [number, number, number?];
};

export type WktPolygon = {
  type: 'Polygon';
  // Single ring for now: [[x,y,z?], ...]
  coordinates: Array<[number, number, number?]>;
};

export type WktGeometry = WktPoint | WktPolygon;

function parseNumberTuple(tuple: string): [number, number, number?] | null {
  const parts = tuple
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((v) => Number.parseFloat(v));

  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }

  return parts.length >= 3 ? [parts[0], parts[1], parts[2]] : [parts[0], parts[1]];
}

export function parseWkt(value: string): WktGeometry | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const input = value.trim();
  const upper = input.toUpperCase();

  // POINT / POINTZ variants.
  // Examples:
  // - POINT(1 2)
  // - POINTZ(1 2 3)
  // - POINT Z (1 2 3)
  const pointMatch = /POINT\s*Z?\s*\(\s*([^)]+)\s*\)/i.exec(input);
  if (pointMatch) {
    const coords = parseNumberTuple(pointMatch[1]);
    if (!coords) return null;
    return { type: 'Point', coordinates: coords };
  }

  // POLYGON / POLYGONZ variants (single ring only).
  // Examples:
  // - POLYGON((x y, ...))
  // - POLYGONZ((x y z, ...))
  // - POLYGON Z ((x y z, ...))
  const polyMatch = /POLYGON\s*Z?\s*\(\(\s*([^)]+?)\s*\)\)/i.exec(input);
  if (polyMatch) {
    const tuples = polyMatch[1].split(',').map((s) => s.trim());
    const coords: Array<[number, number, number?]> = [];
    for (const t of tuples) {
      const parsed = parseNumberTuple(t);
      if (!parsed) return null;
      coords.push(parsed);
    }
    return { type: 'Polygon', coordinates: coords };
  }

  // POLYGONZ without spaces is common in fixtures; normalize via upper check too.
  if (upper.startsWith('POLYGONZ') || upper.startsWith('POLYGON')) {
    // If we got here, it is some other POLYGON form we don't yet parse.
    return null;
  }

  return null;
}
