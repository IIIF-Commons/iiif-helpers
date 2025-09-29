/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { ImageApiSelector, Selector } from '@iiif/presentation-3';
import { flattenCubicBezier, flattenQuadraticBezier } from './bezier';
import { resolveSelectorStyle } from './css-selectors';
import {
  type NormalizedSvgPathCommand,
  type NormalizedSvgPathCommandType,
  parseAndNormalizeSvgPath,
} from './normalize-svg';
import {
  type ParsedSelector,
  type SelectorStyle,
  type SupportedSelectors,
  type SvgSelector,
  type SvgShapeType,
  TemporalBoxSelector,
  type TemporalSelector,
} from './selector-types';

const BOX_SELECTOR =
  /&?(xywh=)?(pixel:|percent:|pct:)?([0-9]+(?:\.[0-9]+)?),([0-9]+(?:\.[0-9]+)?),([0-9]+(?:\.[0-9]+)?),([0-9]+(?:\.[0-9]+)?)/;

// Does not support 00:00:00 or 00:00 formats.
const TEMPORAL_SELECTOR = /&?(t=)(npt:)?([0-9]+(\.[0-9]+)?)?(,([0-9]+(\.[0-9]+)?))?/;

const RGBA_COLOR = /^rgba\((\d+),(\d+),(\d+),([0-9.]+)\)$/;

export function parseSelector(
  source: Selector | Selector[],
  {
    domParser,
    svgPreprocessor,
    iiifRenderingHints,
    loadedStylesheets,
  }: {
    domParser?: DOMParser;
    svgPreprocessor?: (svg: string) => string;
    iiifRenderingHints?: ImageApiSelector;
    loadedStylesheets?: Record<string, string>;
  } = {},
  { styleClass }: { styleClass?: string } = {}
): ParsedSelector {
  if (Array.isArray(source)) {
    return resolveHints(
      (source as Array<string | Selector>).reduce(
        <ParseSelector>(data: ParsedSelector, nextSource: string | Selector) => {
          const {
            selector,
            selectors,
            iiifRenderingHints: newIiifRenderingHints,
          } = parseSelector(
            nextSource,
            {
              domParser,
              svgPreprocessor,
              iiifRenderingHints,
            },
            { styleClass }
          );
          if (selector) {
            if (!data.selector) {
              data.selector = selector;
            } else {
              // @todo we could be smarter about the "main" selector.
              if (!data.selector.temporal && selector.temporal) {
                data.selector.temporal = selector.temporal;
              }
              if (!data.selector.spatial && selector.spatial) {
                data.selector.spatial = selector.spatial;
              }

              // There is a bug here where the type won't resolve correctly... "TemporalSVGSelector" or whatever.
              if (!data.selector.svg && selector.svg) {
                data.selector.svg = selector.svg;
              }
              if (!data.selector.svgShape && selector.svgShape) {
                data.selector.svgShape = selector.svgShape;
              }
            }
            data.selectors.push(...selectors);
          }
          if (newIiifRenderingHints) {
            data.iiifRenderingHints = data.iiifRenderingHints || {
              type: 'ImageApiSelector',
            };
            Object.assign(data.iiifRenderingHints, newIiifRenderingHints);
          }
          return data;
        },
        {
          selector: null,
          selectors: [],
          iiifRenderingHints,
        } as ParsedSelector
      )
    );
  }

  if (!source) {
    return resolveHints({
      selector: null,
      selectors: [],
      iiifRenderingHints,
    });
  }

  if (typeof source === 'string') {
    const [id, fragment] = source.split('#');

    if (!fragment) {
      // This is an unknown selector.
      return resolveHints({
        selector: null,
        selectors: [],
        iiifRenderingHints,
      });
    }

    return parseSelector(
      { type: 'FragmentSelector', value: fragment },
      { svgPreprocessor, iiifRenderingHints, domParser },
      { styleClass }
    );
  }

  if (source.type) {
    if (source.type === 'PointSelector' && (source.t || source.t === 0)) {
      const selector: TemporalSelector = {
        type: 'TemporalSelector',
        temporal: {
          startTime: source.t,
        },
      };

      return resolveHints({
        selector,
        selectors: [selector],
        iiifRenderingHints,
      });
    }

    if (source.type === 'PointSelector' && source.x && source.y) {
      const selector: SupportedSelectors = {
        type: 'PointSelector',
        spatial: {
          x: source.x,
          y: source.y,
        },
      };

      return resolveHints({
        selector,
        selectors: [selector],
        iiifRenderingHints,
      });
    }
  }

  if (isImageApiSelector(source)) {
    const selectors: SupportedSelectors[] = [];
    if (source.region) {
      const parsedRegion = parseSelector(
        { type: 'FragmentSelector', value: 'xywh=' + source.region },
        { domParser, svgPreprocessor, iiifRenderingHints },
        { styleClass }
      );
      selectors.push(...parsedRegion.selectors);
    }

    return resolveHints({
      selector: selectors[0],
      selectors: selectors,
      iiifRenderingHints: iiifRenderingHints ? { ...iiifRenderingHints, ...source } : source,
    });
  }

  if (source.type === 'FragmentSelector') {
    const matchBoxSelector = BOX_SELECTOR.exec(source.value);
    if (matchBoxSelector) {
      let selector: SupportedSelectors = {
        type: 'BoxSelector',
        spatial: {
          unit: matchBoxSelector[2] === 'percent:' || matchBoxSelector[2] === 'pct:' ? 'percent' : 'pixel',
          x: Number.parseFloat(matchBoxSelector[3]),
          y: Number.parseFloat(matchBoxSelector[4]),
          width: Number.parseFloat(matchBoxSelector[5]),
          height: Number.parseFloat(matchBoxSelector[6]),
        },
        boxStyle: resolveSelectorStyle(styleClass, loadedStylesheets),
      };

      const matchBoxTimeSelector = source.value.match(TEMPORAL_SELECTOR);
      if (matchBoxTimeSelector) {
        selector = {
          type: 'TemporalBoxSelector',
          spatial: selector.spatial,
          temporal: {
            startTime: matchBoxTimeSelector[3] ? Number.parseFloat(matchBoxTimeSelector[3]) : 0,
            endTime: matchBoxTimeSelector[6] ? Number.parseFloat(matchBoxTimeSelector[6]) : undefined,
          },
          boxStyle: resolveSelectorStyle(styleClass, loadedStylesheets),
        };
      }

      return resolveHints({
        selector,
        selectors: [selector],
        iiifRenderingHints,
      });
    }

    const matchTimeSelector = source.value.match(TEMPORAL_SELECTOR);
    if (matchTimeSelector) {
      const selector: TemporalSelector = {
        type: 'TemporalSelector',
        temporal: {
          startTime: matchTimeSelector[3] ? Number.parseFloat(matchTimeSelector[3]) : 0,
          endTime: matchTimeSelector[6] ? Number.parseFloat(matchTimeSelector[6]) : undefined,
        },
      };

      return resolveHints({
        selector,
        selectors: [selector],
        iiifRenderingHints,
      });
    }

    return resolveHints({
      selector: null,
      selectors: [],
      iiifRenderingHints,
    });
  }

  if (source.type === 'SvgSelector' && 'value' in source) {
    if (!domParser) {
      if (typeof window !== 'undefined') {
        domParser = new window.DOMParser();
      } else {
        console.warn(
          'No DOMParser available, cannot parse SVG selector, `points`, `spatial` and `style` will be unavailable and the SVG will not be normalized.'
        );
      }
    }
    let points: [number, number][] = [];
    let rect: [number, number, number, number] | undefined;
    let style: SelectorStyle | undefined;
    let svg = svgPreprocessor?.(source.value) ?? source.value;
    let svgShape: SvgShapeType | undefined;
    if (domParser) {
      const svgElement: SVGElement | null = domParser
        .parseFromString(source.value, 'image/svg+xml')
        .querySelector('svg');
      if (!svgElement) {
        console.warn(`Illegal SVG selector: ${source.value}`);
        return resolveHints({
          selector: null,
          selectors: [],
          iiifRenderingHints,
        });
      }
      const selectorElem = getSelectorElement(svgElement);
      if (selectorElem) {
        points = selectorElem.points;
        svgShape = selectorElem.shapeType;
        rect = [
          Math.min(...points.map((p) => p[0])), // llx
          Math.min(...points.map((p) => p[1])), // lly
          Math.max(...points.map((p) => p[0])), // urx
          Math.max(...points.map((p) => p[1])), // ury
        ];
        ({ style, svg } = extractStyles(selectorElem.element) ?? { svg });
      }
    }
    const sel: SvgSelector = {
      type: 'SvgSelector',
      svg,
      svgShape,
      style,
      boxStyle: resolveSelectorStyle(styleClass, loadedStylesheets, style),
      points: points.length ? points : undefined,
      spatial: rect
        ? {
            unit: 'pixel',
            x: rect[0],
            y: rect[1],
            width: rect[2] - rect[0],
            height: rect[3] - rect[1],
          }
        : undefined,
    };
    return resolveHints({
      selector: sel,
      selectors: [sel],
      iiifRenderingHints,
    });
  }
  return resolveHints({
    selector: null,
    selectors: [],
    iiifRenderingHints,
  });
}

export type SelectorElement = {
  element: SVGElement;
  points: [number, number][];
  shapeType: SvgShapeType;
};

function getShapeTypeFromPath(svgPath: NormalizedSvgPathCommand[]): SvgShapeType {
  const cmdFrequencies = svgPath
    .map((seg) => seg[0])
    .reduce(
      (acc: Record<NormalizedSvgPathCommandType, number>, cmd) => {
        acc[cmd] += 1;
        return acc;
      },
      { C: 0, Q: 0, L: 0, M: 0 }
    );
  const cmdTypes = new Set(svgPath.map((seg) => seg[0]));
  if (cmdFrequencies.C > 0 || cmdFrequencies.Q > 0) {
    return 'path';
  }
  if (cmdFrequencies.L > 0 && (cmdTypes.size === 1 || (cmdTypes.size === 2 && cmdTypes.has('M')))) {
    // Only lines and moves: rectangle, polygon or polyline?
    if (cmdFrequencies.L === 4) {
      return 'rect';
    }

    // Check if the path is closed to decide if we have a polygon or a polyline
    const lastSeg = svgPath.slice(-1)[0];
    if (
      (svgPath[0][0] === 'M' && lastSeg[0] === 'L' && lastSeg[1] == svgPath[0][1] && lastSeg[2] === svgPath[0][2]) ||
      (lastSeg[1] === 0 && lastSeg[2] === 0)
    ) {
      return 'polygon';
    } else {
      return 'polyline';
    }
  }
  return 'path';
}

function getSelectorElement(svgElem: SVGElement): SelectorElement | null {
  for (const element of Array.from(svgElem.children) as SVGElement[]) {
    switch (element?.tagName.toLowerCase()) {
      case 'g':
        {
          // Check if any of the children in the container can be converted to points
          const res = getSelectorElement(element as SVGElement);
          if (res) {
            return res;
          }
        }
        continue;
      case 'path': {
        const p = element.getAttribute('d');
        if (!p) {
          continue;
        }
        const normalized = parseAndNormalizeSvgPath(p);
        return {
          element,
          points: pathToPoints(normalized),
          shapeType: getShapeTypeFromPath(normalized),
        };
      }
      case 'circle': {
        const cx = Number.parseFloat(element.getAttribute('cx') ?? '0');
        const cy = Number.parseFloat(element.getAttribute('cy') ?? '0');
        const r = Number.parseFloat(element.getAttribute('r') ?? '0');
        if (!r) {
          continue;
        }
        const points: [number, number][] = [];
        // TODO: Get rid of the degree -> radian conversion and use radians from the beginning
        for (let angle = 0; angle <= 360; angle += 12) {
          const rad = (angle * Math.PI) / 180;
          points.push([cx + r * Math.cos(rad), cy + r * Math.sin(rad)]);
        }
        return { element, points, shapeType: 'circle' };
      }
      case 'ellipse': {
        const cx = Number.parseFloat(element.getAttribute('cx') ?? '0');
        const cy = Number.parseFloat(element.getAttribute('cy') ?? '0');
        const rx = Number.parseFloat(element.getAttribute('rx') ?? '0');
        const ry = Number.parseFloat(element.getAttribute('ry') ?? '0');
        if (!rx && !ry) {
          continue;
        }
        const points: [number, number][] = [];
        for (let angle = 0; angle <= 360; angle += 12) {
          const t = Math.tan((angle / 360) * Math.PI);
          const px = (rx * (1 - t ** 2)) / (1 + t ** 2);
          const py = (ry * 2 * t) / (1 + t ** 2);
          points.push([cx + px, cy + py]);
        }
        return { element, points, shapeType: 'ellipse' };
      }
      case 'line': {
        const x0 = Number.parseFloat(element.getAttribute('x0') ?? '0');
        const y0 = Number.parseFloat(element.getAttribute('y0') ?? '0');
        const x1 = Number.parseFloat(element.getAttribute('x1') ?? '0');
        const y1 = Number.parseFloat(element.getAttribute('y1') ?? '0');
        if (x0 === x1 && y0 === y1) {
          continue;
        }
        return {
          element,
          points: [
            [x0, y0],
            [x1, y1],
          ],
          shapeType: 'polyline',
        };
      }
      case 'polygon':
      case 'polyline': {
        const points =
          element
            .getAttribute('points')
            ?.split(' ')
            .map((ps) => ps.split(',').map(Number.parseFloat) as [number, number]) ?? [];
        if (!points.length) {
          continue;
        }
        let shapeType: SvgShapeType = 'polyline';
        if (element.tagName.toLowerCase() === 'polygon') {
          // A polygon is a closed path, so the last point is the same as the first.
          points.push(points[0]);
          shapeType = 'polygon';
        }
        return { element, points, shapeType };
      }
      case 'rect': {
        const x = Number.parseFloat(element.getAttribute('x') ?? '0');
        const y = Number.parseFloat(element.getAttribute('y') ?? '0');
        const width = Number.parseFloat(element.getAttribute('width') ?? '0');
        const height = Number.parseFloat(element.getAttribute('height') ?? '0');
        if (!width || !height) {
          continue;
        }
        return {
          element,
          points: [
            [x, y],
            [x + width, y],
            [x + width, y + height],
            [x, y + height],
            [x, y],
          ],
          shapeType: 'rect',
        };
      }
      default:
        // Try next element
        continue;
    }
  }
  return null;
}

function pathToPoints(normalizedPath: NormalizedSvgPathCommand[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < normalizedPath.length; i++) {
    const startPoint = out[out.length - 1] ?? [0, 0];
    const seg = normalizedPath[i];
    switch (seg[0]) {
      case 'M':
      case 'L':
        out.push([seg[1], seg[2]]);
        continue;
      case 'C':
        out.push(
          ...flattenCubicBezier(
            { x: startPoint[0], y: startPoint[1] },
            { x: seg[1], y: seg[2] },
            { x: seg[3], y: seg[4] },
            { x: seg[5], y: seg[6] }
          )
            .map((p) => [p.x, p.y] as [number, number])
            .slice(1) // skip first point, already part of output
        );
        continue;
      case 'Q':
        out.push(
          ...flattenQuadraticBezier(
            { x: startPoint[0], y: startPoint[1] },
            { x: seg[1], y: seg[2] },
            { x: seg[3], y: seg[4] }
          )
            .map((p) => [p.x, p.y] as [number, number])
            .slice(1) // skip first point, already part of output
        );
        continue;
    }
  }
  return out;
}

/** Extract styling information from SVG selector.
 *
 * Will remove all styling information from the SVG element
 * and normalize `rgba` colors for `fill` and `stroke` to
 * `rgb` and store the opacity in `fillOpacity` and `strokeOpacity`.
 */
function extractStyles(selectorElement: SVGElement): { style?: SelectorStyle; svg: string } | undefined {
  // TODO: Can this be simplified somehow?
  const style: SelectorStyle = {};
  if (selectorElement.hasAttribute('fill')) {
    style.fill = selectorElement.getAttribute('fill')!;
    selectorElement.removeAttribute('fill');
  } else if (selectorElement.style && selectorElement.style.fill) {
    style.fill = selectorElement.style.fill;
  }
  if (style.fill) {
    const rgbaMatch = RGBA_COLOR.exec(style.fill);
    if (rgbaMatch) {
      style.fillOpacity = Number.parseFloat(rgbaMatch[4]);
      style.fill = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
    }
  }
  if (selectorElement.hasAttribute('fill-opacity')) {
    style.fillOpacity = Number.parseFloat(selectorElement.getAttribute('fill-opacity')!);
    selectorElement.removeAttribute('fill-opacity');
  } else if (selectorElement.style && selectorElement.style.fillOpacity) {
    style.fillOpacity = Number.parseFloat(selectorElement.style.fillOpacity);
  }

  if (selectorElement.hasAttribute('stroke')) {
    style.stroke = selectorElement.getAttribute('stroke')!;
    selectorElement.removeAttribute('stroke');
  } else if (selectorElement.style && selectorElement.style.stroke) {
    style.stroke = selectorElement.style.stroke;
  }
  if (style.stroke) {
    const rgbaMatch = RGBA_COLOR.exec(style.stroke);
    if (rgbaMatch) {
      style.strokeOpacity = Number.parseFloat(rgbaMatch[4]);
      style.stroke = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
    }
  }
  if (selectorElement.hasAttribute('stroke-opacity')) {
    style.strokeOpacity = Number.parseFloat(selectorElement.getAttribute('stroke-opacity')!);
    selectorElement.removeAttribute('stroke-opacity');
  } else if (selectorElement.style && selectorElement.style.strokeOpacity) {
    style.strokeOpacity = Number.parseFloat(selectorElement.style.strokeOpacity);
  }
  if (selectorElement.hasAttribute('stroke-width')) {
    style.strokeWidth = selectorElement.getAttribute('stroke-width')!;
    selectorElement.removeAttribute('stroke-width');
  } else if (selectorElement.style && selectorElement.style.strokeWidth) {
    style.strokeWidth = selectorElement.style.strokeWidth;
  }
  if (selectorElement.hasAttribute('stroke-dasharray')) {
    style.strokeDasharray = selectorElement.getAttribute('stroke-dasharray')!;
    selectorElement.removeAttribute('stroke-dasharray');
  } else if (selectorElement.style && selectorElement.style.strokeDasharray) {
    style.strokeDasharray = selectorElement.style.strokeDasharray;
  }

  let rootElem: SVGElement | null = selectorElement;
  while (rootElem.tagName.toLowerCase() !== 'svg') {
    rootElem = rootElem.parentElement as SVGElement | null;
    if (rootElem === null) {
      throw new Error('Could not find root SVG element');
    }
  }
  return {
    svg: rootElem.outerHTML,
    style: Object.keys(style).length > 0 ? style : undefined,
  };
}

export function isImageApiSelector(t: unknown): t is ImageApiSelector {
  if (!t) return false;
  const type = (t as any).type || (t as any)['@type'];

  return type === 'iiif:ImageApiSelector' || type === 'ImageApiSelector';
}

function resolveHints(supported: ParsedSelector): ParsedSelector {
  if (supported.iiifRenderingHints) {
    const source = supported.iiifRenderingHints;
    if (source.rotation) {
      const parsedRotation = parseRotation(`${source.rotation}`);
      if (parsedRotation) {
        if (supported.selectors.length) {
          for (const selector of supported.selectors) {
            selector.rotation = parsedRotation;
          }
        } else {
          supported.selectors.push({
            type: 'RotationSelector',
            rotation: parsedRotation,
          });
        }
      }
    }
  } else {
    delete supported.iiifRenderingHints;
  }

  return supported;
}

/**
 * Parse rotation "90", "180", "!90"
 */
export function parseRotation(input: string) {
  let num = Number.parseFloat(input);
  if (num && input.startsWith('!')) {
    // @note we don't support mirroring..
    num = 360 - num;
  }
  if (num) {
    num = num % 360;
  }
  if (num !== num) {
    return 0;
  }
  return num || 0;
}
