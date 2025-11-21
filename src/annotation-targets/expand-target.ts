import type { ExternalWebResource, W3CAnnotationTarget } from '@iiif/presentation-3';
import { parseSelector, splitCanvasFragment } from './parse-selector';
import type { ParsedSelector, SupportedSelector } from './selector-types';
import type { SupportedTarget } from './target-types';

export function expandTarget(
  target: W3CAnnotationTarget | W3CAnnotationTarget[],
  options: {
    typeMap?: Record<string, string>;
    domParser?: DOMParser;
    svgPreprocessor?: (svg: string) => string;
    loadedStylesheets?: Record<string, string>;
    defaultType?: string;
    styleClass?: string;
  } = {}
): SupportedTarget {
  if (Array.isArray(target)) {
    // Don't support multiple targets for now.
    return expandTarget(target[0]);
  }

  if (typeof target === 'string') {
    const [id, fragment] = splitCanvasFragment(target);

    if (!fragment) {
      // This is an unknown selector.
      return {
        type: 'SpecificResource',
        source: {
          id,
          type: (options.typeMap && (options.typeMap[id] as any)) || options.defaultType || 'Canvas',
        },
        selector: null,
        selectors: [],
      };
    }

    return expandTarget(
      {
        type: 'SpecificResource',
        source: { id, type: (options.typeMap && (options.typeMap[id] as any)) || options.defaultType || 'Canvas' },
        selector: {
          type: 'FragmentSelector',
          value: fragment,
        },
      },
      options
    );
  }

  // @todo, how do we want to support choices for targets.
  if (
    target.type === 'Choice' ||
    target.type === 'List' ||
    target.type === 'Composite' ||
    target.type === 'Independents'
  ) {
    // we also don't support these, just choose the first.
    return expandTarget(target.items[0], options);
  }

  if (!target.type && 'source' in target) {
    (target as any).type = 'SpecificResource';
  }

  if (target.type === 'SpecificResource') {
    if (target.source.type === 'Canvas' && target.source.partOf && typeof target.source.partOf === 'string') {
      target.source.partOf = [
        {
          id: target.source.partOf,
          type: 'Manifest',
        },
      ];
    }
    const styleClass = target.styleClass || options.styleClass;

    let preParsedSelector = { selector: null, selectors: [] } as ParsedSelector;
    if (typeof target.source === 'string') {
      const [, sourceFragment] = splitCanvasFragment(target.source);
      if (sourceFragment) {
        const expandedAgain = expandTarget(target.source, { ...options, styleClass });
        target.source = expandedAgain.source;
        preParsedSelector = {
          selector: expandedAgain.selector,
          selectors: expandedAgain.selectors,
        };
      }
    }

    const { selector, selectors } = target.selector
      ? parseSelector(target.selector, options, { styleClass })
      : preParsedSelector;

    return {
      type: 'SpecificResource',
      source: target.source,
      selector,
      selectors,
    };
  }

  if (target.id) {
    if ((target as any).type === 'Canvas' && (target as any).partOf && typeof (target as any).partOf === 'string') {
      (target as any).partOf = [
        {
          id: (target as any).partOf,
          type: 'Manifest',
        },
      ];
    }

    const [id, fragment] = splitCanvasFragment(target.id);
    if (!fragment) {
      // This is an unknown selector.
      return {
        type: 'SpecificResource',
        source: {
          ...(target as any),
          id,
        },
        selector: null,
        selectors: [],
      };
    }

    return expandTarget(
      {
        type: 'SpecificResource',
        source: {
          ...(target as any),
          id,
        },
        selector: {
          type: 'FragmentSelector',
          value: fragment,
        },
      },
      options
    );
  }

  return {
    type: 'SpecificResource',
    source: target as ExternalWebResource,
    selector: null,
    selectors: [],
  };
}
