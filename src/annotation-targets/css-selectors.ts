import type { BoxStyle, SelectorStyle, SelectorTransform, TransformPoint, TransformUnit } from './selector-types';

const LENGTH = /^(-?(?:\d+|\d*\.\d+))(px|%)?$/;
const ANGLE = /^(-?(?:\d+|\d*\.\d+))(deg|rad|turn)?$/;
const TRANSFORM_FUNCTION = /([a-zA-Z0-9]+)\(([^)]*)\)/g;

function getUnit(unit?: string): TransformUnit | undefined {
  if (unit === '%') {
    return 'percent';
  }
  if (!unit || unit === 'px') {
    return 'pixel';
  }
  return undefined;
}

function parseLength(value: string): { value: number; unit?: TransformUnit } | undefined {
  const match = LENGTH.exec(value.trim());
  if (!match) {
    return undefined;
  }

  return {
    value: Number.parseFloat(match[1]),
    unit: getUnit(match[2]),
  };
}

function parseLengthPair(value: string): TransformPoint | undefined {
  const [xValue, yValue = xValue] = value.trim().split(/\s+/);
  const x = parseLength(xValue);
  const y = parseLength(yValue);

  if (!x || !y) {
    return undefined;
  }

  const point: TransformPoint = {
    x: x.value,
    y: y.value,
  };

  if (x.unit && x.unit === y.unit) {
    point.unit = x.unit;
  } else {
    if (x.unit) {
      point.xUnit = x.unit;
    }
    if (y.unit) {
      point.yUnit = y.unit;
    }
  }

  return point;
}

function parseAngle(value: string): number | undefined {
  const match = ANGLE.exec(value.trim());
  if (!match) {
    return undefined;
  }

  const angle = Number.parseFloat(match[1]);
  const unit = match[2] || 'deg';

  if (unit === 'rad') {
    return (angle * 180) / Math.PI;
  }

  if (unit === 'turn') {
    return angle * 360;
  }

  return angle;
}

function mergeTranslate(current: TransformPoint | undefined, next: TransformPoint): TransformPoint {
  if (!current) {
    return next;
  }

  return {
    x: current.x + next.x,
    y: current.y + next.y,
    ...(current.unit && current.unit === next.unit ? { unit: current.unit } : {}),
  };
}

export function parseCssToBoxStyleMap(css: string): Record<string, BoxStyle> {
  const result: Record<string, BoxStyle> = {};

  // Remove comments and normalize whitespace
  const cleanCss = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Match CSS rules with selectors and their properties
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    const selectorPart = match[1].trim();
    const propertiesPart = match[2].trim();

    // Extract class name from selector (remove . prefix)
    const classMatch = selectorPart.match(/\.([a-zA-Z0-9_-]+)/);
    if (!classMatch) continue;

    const className = classMatch[1];

    // Parse properties
    const properties = propertiesPart.split(';').filter((prop) => prop.trim());
    const style: BoxStyle = {};

    for (const prop of properties) {
      const [key, value] = prop.split(':').map((s) => s.trim());
      if (!key || !value) continue;

      // Convert CSS property names to camelCase and map to BoxStyle properties
      switch (key) {
        case 'background-color':
          style.backgroundColor = value;
          break;
        case 'opacity':
          style.opacity = parseFloat(value);
          break;
        case 'box-shadow':
          style.boxShadow = value;
          break;
        case 'border-color':
          style.borderColor = value;
          break;
        case 'border-width':
          style.borderWidth = value;
          break;
        case 'border-style':
          style.borderStyle = value;
          break;
        case 'outline-color':
          style.outlineColor = value;
          break;
        case 'outline-width':
          style.outlineWidth = value;
          break;
        case 'outline-offset':
          style.outlineOffset = value;
          break;
        case 'outline-style':
          style.outlineStyle = value;
          break;
        case 'border':
          style.border = value;
          break;
        case 'outline':
          style.outline = value;
          break;
        case 'background':
          style.background = value;
          break;
        case 'transform':
          style.transform = value;
          break;
        case 'transform-origin':
          style.transformOrigin = value;
          break;
      }
    }

    result[className] = style;
  }

  return result;
}

export function convertSelectorStyleToBoxStyle(style?: SelectorStyle): BoxStyle {
  const result: BoxStyle = {};

  if (!style) {
    return result;
  }

  if (style.fill) {
    result.backgroundColor = style.fill;
    if (style.fillOpacity) {
      // @todo.
    }
  }

  if (style.stroke) {
    result.borderColor = style.stroke;
  }

  if (style.strokeWidth) {
    result.borderWidth = style.strokeWidth;
  }

  return result;
}

export function convertBoxStyleToSelectorStyle(style: BoxStyle): SelectorStyle {
  const result: SelectorStyle = {};

  // Map backgroundColor to fill
  if (style.backgroundColor) {
    result.fill = style.backgroundColor;
  }

  // Map background to fill if backgroundColor is not available
  if (!result.fill && style.background) {
    result.fill = style.background;
  }

  // Map opacity to fillOpacity
  if (typeof style.opacity !== 'undefined') {
    result.fillOpacity = style.opacity;
  }

  // Map border properties to stroke
  if (style.borderColor) {
    result.stroke = style.borderColor;
  }

  // Map border shorthand to stroke if borderColor is not available
  if (!result.stroke && style.border) {
    // Extract color from border shorthand (simplified approach)
    const borderParts = style.border.split(' ');
    const colorPart = borderParts.find(
      (part) => part.startsWith('#') || part.startsWith('rgb') || part.match(/^[a-z]+$/i)
    );
    if (colorPart) {
      result.stroke = colorPart;
    }
  }

  // Map borderWidth to strokeWidth
  if (style.borderWidth) {
    result.strokeWidth = style.borderWidth;
  }

  // Extract stroke width from border shorthand if borderWidth is not available
  if (!result.strokeWidth && style.border) {
    const borderParts = style.border.split(' ');
    const widthPart = borderParts.find((part) => part.match(/^\d+(?:px|em|rem|%)?$/));
    if (widthPart) {
      result.strokeWidth = widthPart;
    }
  }

  return result;
}

export function parseCssTransformOrigin(transformOrigin?: string): TransformPoint | undefined {
  if (!transformOrigin) {
    return undefined;
  }

  return parseLengthPair(transformOrigin);
}

export function parseCssTransform(transform?: string): SelectorTransform {
  const result: SelectorTransform = {};

  if (!transform) {
    return result;
  }

  result.transform = transform;

  let match;
  TRANSFORM_FUNCTION.lastIndex = 0;
  while ((match = TRANSFORM_FUNCTION.exec(transform)) !== null) {
    const name = match[1].toLowerCase();
    const args = match[2]
      .split(',')
      .flatMap((arg) => arg.trim().split(/\s+/))
      .filter(Boolean);

    if (name === 'rotate') {
      const rotation = parseAngle(args[0] || '');
      if (typeof rotation !== 'undefined') {
        result.rotation = rotation;
      }
      continue;
    }

    if (name === 'translatex') {
      const x = parseLength(args[0] || '');
      if (x) {
        result.translate = mergeTranslate(result.translate, {
          x: x.value,
          y: 0,
          ...(x.unit ? { unit: x.unit } : {}),
        });
      }
      continue;
    }

    if (name === 'translatey') {
      const y = parseLength(args[0] || '');
      if (y) {
        result.translate = mergeTranslate(result.translate, {
          x: 0,
          y: y.value,
          ...(y.unit ? { unit: y.unit } : {}),
        });
      }
      continue;
    }

    if (name === 'translate') {
      const x = parseLength(args[0] || '');
      const y = parseLength(args[1] || '0');
      if (x && y) {
        const point: TransformPoint = {
          x: x.value,
          y: y.value,
        };
        if (x.unit && x.unit === y.unit) {
          point.unit = x.unit;
        } else {
          if (x.unit) {
            point.xUnit = x.unit;
          }
          if (y.unit) {
            point.yUnit = y.unit;
          }
        }
        result.translate = mergeTranslate(result.translate, point);
      }
    }
  }

  return result;
}

export function parseCssTransformStyle(style?: BoxStyle): SelectorTransform {
  const result = parseCssTransform(style?.transform);
  const rotationOrigin = parseCssTransformOrigin(style?.transformOrigin);

  if (style?.transformOrigin) {
    result.transformOrigin = style.transformOrigin;
  }

  if (rotationOrigin) {
    result.rotationOrigin = rotationOrigin;
  }

  return result;
}

export function getSelectorTransformAttributes(style?: BoxStyle): Partial<{
  rotation: number;
  rotationOrigin: TransformPoint;
  translate: TransformPoint;
  transform: SelectorTransform;
}> {
  const transform = parseCssTransformStyle(style);
  const attributes: Partial<{
    rotation: number;
    rotationOrigin: TransformPoint;
    translate: TransformPoint;
    transform: SelectorTransform;
  }> = {};

  if (typeof transform.rotation !== 'undefined') {
    attributes.rotation = transform.rotation;
  }
  if (transform.rotationOrigin) {
    attributes.rotationOrigin = transform.rotationOrigin;
  }
  if (transform.translate) {
    attributes.translate = transform.translate;
  }
  if (
    typeof transform.rotation !== 'undefined' ||
    transform.rotationOrigin ||
    transform.translate ||
    transform.transform ||
    transform.transformOrigin
  ) {
    attributes.transform = transform;
  }

  return attributes;
}

const styleParsedCache = new Map<string, { css: string; styleMap: Record<string, BoxStyle> }>();

export function cachedParseCssToBoxStyleMap(id: string, css: string) {
  const cached = styleParsedCache.get(id);
  if (cached?.css === css) {
    return cached.styleMap;
  }

  const styleMap = parseCssToBoxStyleMap(css);
  styleParsedCache.set(id, {
    css,
    styleMap: Object.fromEntries(Object.entries(styleMap).map(([key, value]) => [key, value])),
  });

  return styleMap;
}

export function resolveSelectorStyle(
  styleClass?: string,
  loadedStylesheets?: Record<string, string>,
  existingStyle: SelectorStyle = {}
): BoxStyle {
  if (!styleClass || !loadedStylesheets) {
    return convertSelectorStyleToBoxStyle(existingStyle || {});
  }

  const newStyle = convertSelectorStyleToBoxStyle(existingStyle || {});
  const stylesheetEntries = Object.entries(loadedStylesheets);

  for (const [id, css] of stylesheetEntries) {
    if (!css) continue;
    const styleMap = cachedParseCssToBoxStyleMap(id, css);
    const classes = Object.entries(styleMap);
    for (const [className, classStyle] of classes) {
      if (className === styleClass) {
        Object.assign(newStyle, classStyle);
      }
    }
  }

  return newStyle;
}
