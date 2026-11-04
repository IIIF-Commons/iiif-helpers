import { describe, expect, test } from "vitest";
import { parseSceneTarget } from "../../../src/scenes";

const scene = { id: "https://example.org/scene", type: "Scene" };

describe("Presentation 4 Scene targets", () => {
  test("defaults a whole Scene to its origin", () => {
    expect(parseSceneTarget(scene)).toMatchObject({
      source: scene,
      point: [0, 0, 0],
      selectors: [],
    });
  });

  test("parses Scene position and temporal fragments", () => {
    expect(parseSceneTarget("https://example.org/scene#3,0,-2&t=30,60")).toMatchObject({
      source: scene,
      point: [3, 0, -2],
      temporal: { start: 30, end: 60 },
    });
    expect(
      parseSceneTarget({
        id: "https://example.org/scene#3,0,-2&t=30,60",
        type: "Scene",
      })
    ).toMatchObject({
      source: scene,
      point: [3, 0, -2],
      temporal: { start: 30, end: 60 },
    });
  });

  test("preserves fragment identifiers that name a whole Scene", () => {
    const named = {
      id: "https://example.org/manifest.json#scene-p1",
      type: "Scene",
    };
    for (const source of [named, named.id]) {
      expect(parseSceneTarget(source)).toMatchObject({
        source: named,
        point: [0, 0, 0],
        selectors: [],
      });
    }
  });

  test.each([
    ["https://kasane.ldas.jp/manifests/sample-manifest-with-annotations.json#scene-p1", [-0.25, 0.76, -0.58]],
    ["https://nakamura196.github.io/hongo-campus-iiif/ueno.json#scene", [-46.88, 6.66, -28.41]],
  ] as const)("keeps named Scene identity and explicit annotation coordinates for %s", (id, point) => {
    const source = { id, type: "Scene" };
    const target = parseSceneTarget(
      {
        type: "SpecificResource",
        source,
        selector: [{ type: "PointSelector", x: point[0], y: point[1], z: point[2] }],
      },
      source
    );
    expect(target.source).toEqual(source);
    expect(target.point).toEqual(point);
    expect(target.selectors).toHaveLength(1);
    expect(target.selector).toMatchObject({
      type: "PointSelector",
      spatial: { x: point[0], y: point[1], z: point[2] },
    });
  });

  test("skips uninterpretable selector alternatives rather than masking a supported point", () => {
    const target = parseSceneTarget({
      type: "SpecificResource",
      source: scene,
      selector: [
        { type: "FragmentSelector", value: "scene-p1" },
        { type: "PointSelector", x: 1, y: 2, z: 3 },
      ],
    });
    expect(target.point).toEqual([1, 2, 3]);
    expect(target.selectors).toHaveLength(2);
    expect(target.selector?.type).toBe("PointSelector");
  });

  test("combines selector refinements but treats selector arrays as alternatives", () => {
    const target = parseSceneTarget({
      type: "SpecificResource",
      source: scene,
      selector: [
        { type: "AnimationSelector", value: "idle" },
        {
          type: "PointSelector",
          x: 1,
          y: 2,
          z: 3,
          instant: 4,
          refinedBy: { type: "FragmentSelector", value: "t=5,8" },
        },
      ],
    });

    expect(target.selectors).toHaveLength(2);
    expect(target.selectors[1]).toHaveLength(2);
    expect(target.point).toEqual([1, 2, 3]);
    expect(target.temporal).toEqual({ start: 5, end: 8 });
  });

  test("retains full Z multi-geometries from WKT", () => {
    const target = parseSceneTarget({
      type: "SpecificResource",
      source: scene,
      selector: {
        type: "WktSelector",
        value: "MULTIPOLYGON Z (((0 0 1, 2 0 1, 2 2 1, 0 0 1)))",
      },
    });
    expect(target.geometry).toMatchObject({ type: "MultiPolygon" });
    expect(target.geometry?.type === "MultiPolygon" ? target.geometry.coordinates[0][0][0] : null).toEqual([0, 0, 1]);
  });
});
