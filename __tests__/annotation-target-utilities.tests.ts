import { describe, expect, test } from "vitest";
import { isRectangle, polygonToBoundingBox, serializeSupportedSelector } from "../src/annotation-targets";

describe("annotation target utilities", () => {
  test("recognizes only complete axis-aligned rectangles", () => {
    expect(
      isRectangle([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ])
    ).toBe(true);
    expect(
      isRectangle([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ])
    ).toBe(true);
    expect(
      isRectangle([
        [0, 0],
        [10, 0],
        [0, 10],
      ])
    ).toBe(false);
    expect(
      isRectangle([
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 10],
      ])
    ).toBe(false);
  });

  test("calculates a tight bounding box for negative coordinates", () => {
    expect(
      polygonToBoundingBox({
        points: [
          [-5, -5],
          [-1, -5],
          [-1, -1],
          [-5, -1],
        ],
      })
    ).toEqual({ x: -5, y: -5, width: 4, height: 4 });
  });

  test("serializes polygons, polylines, and boxes without shape or numeric loss", () => {
    expect(
      serializeSupportedSelector({
        type: "SvgSelector",
        svg: "",
        svgShape: "polyline",
        points: [
          [0, 0],
          [10, 5],
        ],
      })
    ).toMatchObject({ type: "SvgSelector", value: expect.stringContaining("<polyline ") });
    expect(
      serializeSupportedSelector({
        type: "SvgSelector",
        svg: "",
        svgShape: "polygon",
        points: [
          [0, 0],
          [10, 0],
          [5, 5],
        ],
      })
    ).toMatchObject({ type: "SvgSelector", value: expect.stringContaining("<polygon ") });
    expect(
      serializeSupportedSelector({
        type: "BoxSelector",
        spatial: { unit: "percent", x: 0.5, y: 1.25, width: 4_000_000_000, height: 20.5 },
      })
    ).toEqual({ type: "FragmentSelector", value: "xywh=percent:0.5,1.25,4000000000,20.5" });
  });
});
