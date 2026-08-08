declare module "@terraformer/wkt" {
  export function wktToGeoJSON(value: string): unknown;
  export function geojsonToWKT(value: unknown): string;
}
