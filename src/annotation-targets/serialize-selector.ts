import type { FragmentSelector, SvgSelector as W3CSvgSelector } from "@iiif/parser/presentation-3/types";
import type { BoxSelector, SupportedSelector, SvgSelector } from "./selector-types";

export function isSvgSelector(selector: SupportedSelector): selector is SvgSelector {
  return selector.type === "SvgSelector";
}

export function isBoxSelector(selector: SupportedSelector): selector is BoxSelector {
  return selector.type === "BoxSelector";
}

export function serializeSupportedSelector(
  selector: SupportedSelector,
  dimensions?: { width: number; height: number } | null
): FragmentSelector | W3CSvgSelector | null {
  if (isSvgSelector(selector)) {
    if ((!selector.points || selector.points.length === 0) && selector.svg) {
      return { type: "SvgSelector", value: selector.svg };
    }
    if (!selector.points?.length || selector.points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
      return null;
    }

    const element = selector.svgShape === "polyline" ? "polyline" : "polygon";
    const size =
      dimensions && dimensions.width > 0 && dimensions.height > 0
        ? ` viewBox="0 0 ${dimensions.width} ${dimensions.height}" width="${dimensions.width}" height="${dimensions.height}"`
        : "";
    const points = selector.points.map(([x, y]) => `${x},${y}`).join(" ");
    return {
      type: "SvgSelector",
      value: `<svg xmlns="http://www.w3.org/2000/svg"${size}><${element} points="${points}" /></svg>`,
    };
  }

  if (!isBoxSelector(selector)) {
    return null;
  }
  const { x, y, width, height, unit } = selector.spatial;
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }
  return {
    type: "FragmentSelector",
    value: `xywh=${unit === "percent" ? "percent:" : ""}${x},${y},${width},${height}`,
  };
}
