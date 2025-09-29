import type { BoxStyle, SelectorStyle } from './selector-types';

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

const styleParsedCache = new Map<string, Record<string, BoxStyle>>();

export function cachedParseCssToBoxStyleMap(id: string, css: string) {
  if (styleParsedCache.has(id)) {
    return styleParsedCache.get(id)!;
  }

  const styleMap = parseCssToBoxStyleMap(css);
  styleParsedCache.set(id, Object.fromEntries(Object.entries(styleMap).map(([key, value]) => [key, value])));

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
