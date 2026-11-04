import type { Selector, Transform } from "@iiif/parser/presentation-4/types";
import { parseWkt, type GeoJSONGeometry } from "../annotation-targets/wkt";
export type { GeoJSONGeometry } from "../annotation-targets/wkt";

export type SelectorChain = readonly Selector[];

export type SceneTemporalTarget = {
  start: number;
  end?: number;
  instant?: number;
};

export type SceneTarget = {
  source: { id: string; type: string };
  point: [number, number, number] | null;
  geometry: GeoJSONGeometry | null;
  temporal: SceneTemporalTarget | null;
  selectors: readonly SelectorChain[];
  transform: readonly Transform[];
  /** @deprecated Use selectors; retained for the original Scene helper API. */
  selector?: { type: string; spatial?: { x: number; y: number; z?: number } } | null;
};

type TargetObject = {
  id?: string;
  type?: string;
  source?: unknown;
  selector?: Selector | Selector[];
  transform?: Transform | Transform[];
  position?: unknown;
};

function reference(value: unknown, fallback: SceneTarget["source"]): SceneTarget["source"] {
  if (typeof value === "string") {
    return { id: resourceId(value) || fallback.id, type: fallback.type };
  }
  if (value && typeof value === "object") {
    const object = value as { id?: unknown; type?: unknown };
    if (typeof object.id === "string") {
      return {
        id: resourceId(object.id),
        type: typeof object.type === "string" ? object.type : fallback.type,
      };
    }
  }
  return fallback;
}

function selectorChain(selector: Selector): Selector[] {
  const chain: Selector[] = [];
  let current: Selector | undefined = selector;
  const seen = new Set<object>();
  while (current && typeof current === "object" && !seen.has(current as object)) {
    seen.add(current as object);
    chain.push(current);
    current = (current as Selector & { refinedBy?: Selector }).refinedBy;
  }
  return chain;
}

function fragmentSelector(value: string): Selector | null {
  const hash = value.indexOf("#");
  if (hash === -1) return null;
  const fragment = value.slice(hash + 1);
  const parsed = parseFragment(fragment);
  // Fragments can identify a Scene itself, e.g. manifest.json#scene-p1.
  // Only recognized spatial/temporal media fragments become selectors.
  return parsed.point || parsed.temporal ? ({ type: "FragmentSelector", value: fragment } as Selector) : null;
}

function resourceId(value: string) {
  return fragmentSelector(value) ? value.slice(0, value.indexOf("#")) : value;
}

function referenceFragment(value: unknown): Selector | null {
  if (typeof value === "string") return fragmentSelector(value);
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string") {
    return fragmentSelector((value as { id: string }).id);
  }
  return null;
}

function parseFragment(value: string) {
  const spatial = /(?:^|&)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:&|$)/.exec(value);
  const temporal = /(?:^|&)t=(?:npt:)?(-?\d+(?:\.\d+)?)?(?:,(-?\d+(?:\.\d+)?)?)?(?:&|$)/.exec(value);
  return {
    point: spatial ? ([Number(spatial[1]), Number(spatial[2]), Number(spatial[3])] as [number, number, number]) : null,
    temporal: temporal
      ? ({
          start: temporal[1] ? Number(temporal[1]) : 0,
          ...(temporal[2] ? { end: Number(temporal[2]) } : {}),
        } as SceneTemporalTarget)
      : null,
  };
}

function applySelector(
  selector: Selector,
  current: Pick<SceneTarget, "point" | "geometry" | "temporal">
): Pick<SceneTarget, "point" | "geometry" | "temporal"> {
  const value = selector as Selector & {
    type: string;
    value?: string;
    x?: number;
    y?: number;
    z?: number;
    instant?: number;
  };

  if (value.type === "PointSelector") {
    return {
      ...current,
      point:
        typeof value.x === "number" && typeof value.y === "number"
          ? [value.x, value.y, typeof value.z === "number" ? value.z : 0]
          : current.point,
      temporal: typeof value.instant === "number" ? { start: value.instant, instant: value.instant } : current.temporal,
    };
  }
  if (value.type === "WktSelector" || value.type === "WKTSelector" || value.type === "PolygonZSelector") {
    const geometry = typeof value.value === "string" ? parseWkt(value.value) : null;
    return {
      ...current,
      geometry,
      point:
        geometry?.type === "Point"
          ? [geometry.coordinates[0], geometry.coordinates[1], geometry.coordinates[2] || 0]
          : current.point,
    };
  }
  if (value.type === "FragmentSelector" && typeof value.value === "string") {
    const parsed = parseFragment(value.value);
    return {
      ...current,
      point: parsed.point || current.point,
      temporal: parsed.temporal || current.temporal,
    };
  }
  return current;
}

/**
 * Interpret a Presentation 4 Scene target. Selector arrays remain ordered
 * alternatives; refinement only combines selectors inside the selected chain.
 */
export function parseSceneTarget(
  input: unknown,
  defaultSource: SceneTarget["source"] = { id: "", type: "Scene" }
): SceneTarget {
  const object = input && typeof input === "object" ? (input as TargetObject) : null;
  const specific = object?.type === "SpecificResource" || !!object?.source;
  const rawSource = specific ? object?.source : input;
  const source = reference(rawSource, defaultSource);
  const inlineFragment = referenceFragment(rawSource);
  const selectors = [
    ...(inlineFragment ? [inlineFragment] : []),
    ...((Array.isArray(object?.selector) ? object.selector : object?.selector ? [object.selector] : []) as Selector[]),
  ].map(selectorChain);
  const transform = object?.transform ? (Array.isArray(object.transform) ? object.transform : [object.transform]) : [];

  let interpreted: Pick<SceneTarget, "point" | "geometry" | "temporal"> = {
    point: selectors.length ? null : [0, 0, 0],
    geometry: null,
    temporal: null,
  };
  const preferred =
    selectors.find((chain) => {
      let candidate: Pick<SceneTarget, "point" | "geometry" | "temporal"> = {
        point: null,
        geometry: null,
        temporal: null,
      };
      for (const selector of chain) candidate = applySelector(selector, candidate);
      return candidate.point || candidate.geometry || candidate.temporal;
    }) || selectors[0];
  for (const selector of preferred || []) interpreted = applySelector(selector, interpreted);

  if (!interpreted.point && object?.position) {
    interpreted = parseSceneTarget(object.position, source);
  }

  const firstSelector = preferred?.[0] as { type?: string } | undefined;
  const legacySelector =
    firstSelector?.type === "PointSelector" && interpreted.point
      ? {
          type: "PointSelector",
          spatial: { x: interpreted.point[0], y: interpreted.point[1], z: interpreted.point[2] },
        }
      : null;
  return { source, ...interpreted, selectors, transform, selector: legacySelector };
}
