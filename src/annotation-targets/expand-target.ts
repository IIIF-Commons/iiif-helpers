import type {
  ExternalWebResource as ExternalWebResourceV3,
  W3CAnnotationTarget as W3CAnnotationTargetV3,
} from '@iiif/parser/presentation-3/types';
import type {
  Annotation as AnnotationV4,
  ContentResourceLike as ContentResourceLikeV4,
} from '@iiif/parser/presentation-4/types';
import { parseSelector, splitCanvasFragment } from './parse-selector';
import type { ParsedSelector, SupportedSelector } from './selector-types';
import type { SupportedTarget } from './target-types';

type AnnotationTargetV4 = Exclude<AnnotationV4['target'], undefined>;
type ExpandableTarget = W3CAnnotationTargetV3 | AnnotationTargetV4;
type ExternalWebResource = ExternalWebResourceV3 | ContentResourceLikeV4;

export function expandTarget(
  target: ExpandableTarget | ExpandableTarget[],
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
    return expandTarget(target[0], options);
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

  const targetAny = target as any;

  // @todo, how do we want to support choices for targets.
  if (
    targetAny.type === 'Choice' ||
    targetAny.type === 'List' ||
    targetAny.type === 'Composite' ||
    targetAny.type === 'Independents'
  ) {
    // we also don't support these, just choose the first.
    return expandTarget(targetAny.items[0], options);
  }

  if (!targetAny.type && 'source' in targetAny) {
    targetAny.type = 'SpecificResource';
  }

  if (targetAny.type === 'SpecificResource') {
    if (targetAny.source.type === 'Canvas' && targetAny.source.partOf && typeof targetAny.source.partOf === 'string') {
      targetAny.source.partOf = [
        {
          id: targetAny.source.partOf,
          type: 'Manifest',
        },
      ];
    }
    const styleClass = targetAny.styleClass || options.styleClass;

    let preParsedSelector = { selector: null, selectors: [] } as ParsedSelector;
    if (typeof targetAny.source === 'string') {
      const [, sourceFragment] = splitCanvasFragment(targetAny.source);
      if (sourceFragment) {
        const expandedAgain = expandTarget(targetAny.source, { ...options, styleClass });
        targetAny.source = expandedAgain.source;
        preParsedSelector = {
          selector: expandedAgain.selector,
          selectors: expandedAgain.selectors,
        };
      }
    }

    const { selector, selectors } = targetAny.selector
      ? parseSelector(targetAny.selector, options, { styleClass })
      : preParsedSelector;

    return {
      type: 'SpecificResource',
      source: targetAny.source,
      selector,
      selectors,
    };
  }

  if (targetAny.id) {
    if (targetAny.type === 'Canvas' && targetAny.partOf && typeof targetAny.partOf === 'string') {
      targetAny.partOf = [
        {
          id: targetAny.partOf,
          type: 'Manifest',
        },
      ];
    }

    const [id, fragment] = splitCanvasFragment(targetAny.id);
    if (!fragment) {
      // This is an unknown selector.
      return {
        type: 'SpecificResource',
        source: {
          ...targetAny,
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
          ...targetAny,
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
    source: targetAny as ExternalWebResource,
    selector: null,
    selectors: [],
  };
}
