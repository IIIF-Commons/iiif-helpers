import type {
  ExternalWebResource as ExternalWebResourceV3,
  W3CAnnotationTarget as W3CAnnotationTargetV3,
} from '@iiif/parser/presentation-3/types';
import type {
  Annotation as AnnotationV4,
  ContentResourceLike as ContentResourceLikeV4,
} from '@iiif/parser/presentation-4/types';
import { resolveAnnotationValues, type AnnotationAggregateStep } from '../annotation-values';
import { parseSelector, splitCanvasFragment } from './parse-selector';
import type { ParsedSelector, SupportedSelector } from './selector-types';
import type { SupportedTarget } from './target-types';

type AnnotationTargetV4 = Exclude<AnnotationV4['target'], undefined>;
type ExpandableTarget = W3CAnnotationTargetV3 | AnnotationTargetV4;
type ExternalWebResource = ExternalWebResourceV3 | ContentResourceLikeV4;

export type ExpandTargetOptions = {
  typeMap?: Record<string, string>;
  domParser?: DOMParser;
  svgPreprocessor?: (svg: string) => string;
  loadedStylesheets?: Record<string, string>;
  defaultType?: string;
  styleClass?: string;
};

export type ExpandedAnnotationTarget = {
  target: SupportedTarget;
  aggregatePath: AnnotationAggregateStep[];
};

export function expandTarget(
  target: ExpandableTarget | ExpandableTarget[],
  options: ExpandTargetOptions = {}
): SupportedTarget {
  const first = expandTargets(target, options)[0];
  if (!first) {
    throw new Error('Cannot expand an empty annotation target');
  }
  return first.target;
}

export function expandTargets(
  target: ExpandableTarget | ExpandableTarget[],
  options: ExpandTargetOptions = {}
): ExpandedAnnotationTarget[] {
  return resolveAnnotationValues(target).map(({ value, aggregatePath, specificResources }) => ({
    target: expandTargetValue((specificResources[specificResources.length - 1] || value) as ExpandableTarget, options),
    aggregatePath,
  }));
}

function expandTargetValue(target: ExpandableTarget, options: ExpandTargetOptions): SupportedTarget {
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

    return expandTargetValue(
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

  let targetAny = target as any;

  if (!targetAny.type && 'source' in targetAny) {
    targetAny = { ...targetAny, type: 'SpecificResource' };
  }

  if (targetAny.type === 'SpecificResource') {
    let source = targetAny.source;
    if (source?.type === 'Canvas' && source.partOf && typeof source.partOf === 'string') {
      source = {
        ...source,
        partOf: [
          {
            id: source.partOf,
            type: 'Manifest',
          },
        ],
      };
    }
    const styleClass = targetAny.styleClass || options.styleClass;

    let preParsedSelector = { selector: null, selectors: [] } as ParsedSelector;
    if (typeof source === 'string') {
      const [, sourceFragment] = splitCanvasFragment(source);
      if (sourceFragment) {
        const expandedAgain = expandTargetValue(source, { ...options, styleClass });
        source = expandedAgain.source;
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
      source,
      ...(Array.isArray(targetAny.transform) ? { transform: [...targetAny.transform] } : {}),
      ...(Array.isArray(targetAny.action) ? { action: [...targetAny.action] } : {}),
      selector,
      selectors,
    };
  }

  if (targetAny.id) {
    let source = targetAny;
    if (targetAny.type === 'Canvas' && targetAny.partOf && typeof targetAny.partOf === 'string') {
      source = {
        ...targetAny,
        partOf: [
          {
            id: targetAny.partOf,
            type: 'Manifest',
          },
        ],
      };
    }

    const [id, fragment] = splitCanvasFragment(targetAny.id);
    if (!fragment) {
      // This is an unknown selector.
      return {
        type: 'SpecificResource',
        source: {
          ...source,
          id,
        },
        selector: null,
        selectors: [],
      };
    }

    return expandTargetValue(
      {
        type: 'SpecificResource',
        source: {
          ...source,
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
