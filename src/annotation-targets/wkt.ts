import { wktToGeoJSON } from '@terraformer/wkt';

export type GeoJSONPosition = [number, number, ...number[]];

export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: GeoJSONPosition }
  | { type: 'MultiPoint'; coordinates: GeoJSONPosition[] }
  | { type: 'LineString'; coordinates: GeoJSONPosition[] }
  | { type: 'MultiLineString'; coordinates: GeoJSONPosition[][] }
  | { type: 'Polygon'; coordinates: GeoJSONPosition[][] }
  | { type: 'MultiPolygon'; coordinates: GeoJSONPosition[][][] }
  | { type: 'GeometryCollection'; geometries: GeoJSONGeometry[] };

/** Parse the complete WKT geometry family into renderer-neutral GeoJSON. */
export function parseWkt(value: string): GeoJSONGeometry | null {
  if (!value || typeof value !== 'string') return null;

  try {
    // The draft examples use the common compact `POLYGONZ` spelling while
    // Terraformer accepts the equivalent standards spelling `POLYGON Z`.
    const normalized = value.replace(/^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)Z\b/i, '$1 Z');
    const geometry = wktToGeoJSON(normalized) as GeoJSONGeometry | null;
    return geometry && typeof geometry.type === 'string' ? geometry : null;
  } catch {
    return null;
  }
}
