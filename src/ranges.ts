import { compressSpecificResource } from '@iiif/parser';
import type {
  Canvas as CanvasV3,
  InternationalString as InternationalStringV3,
  Manifest as ManifestV3,
  Range as RangeV3,
  Reference as ReferenceV3,
  SpecificResource as SpecificResourceV3,
} from '@iiif/parser/presentation-3/types';
import type {
  CanvasNormalized as CanvasNormalizedV3,
  ManifestNormalized as ManifestNormalizedV3,
  RangeNormalized as RangeNormalizedV3,
} from '@iiif/parser/presentation-3-normalized/types';
import type {
  Canvas as CanvasV4,
  LanguageMap as InternationalStringV4,
  Manifest as ManifestV4,
  Range as RangeV4,
  Reference as ReferenceV4,
  SpecificResource as SpecificResourceV4,
} from '@iiif/parser/presentation-4/types';
import type {
  CanvasNormalized as CanvasNormalizedV4,
  ManifestNormalized as ManifestNormalizedV4,
  RangeNormalized as RangeNormalizedV4,
} from '@iiif/parser/presentation-4-normalized/types';
import { splitCanvasFragment } from './annotation-targets';
import { type CompatVault, compatVault } from './compat';
import { hash } from './shared-utilities';

type Reference<T extends string = string> = ReferenceV3<T> | ReferenceV4<T>;
type RangeLike = RangeV3 | RangeV4 | RangeNormalizedV3 | RangeNormalizedV4 | Reference<'Range'>;
type CanvasLike = CanvasV3 | CanvasV4 | CanvasNormalizedV3 | CanvasNormalizedV4 | Reference<'Canvas'>;
type ContainerType = 'Canvas' | 'Timeline' | 'Scene';
type ContainerReference = Reference<ContainerType>;
type InternationalString = InternationalStringV3 | InternationalStringV4;
type AnySpecificResource = SpecificResourceV3 | SpecificResourceV4;
type SpecificCanvasResource = SpecificResourceV3<Reference<'Canvas'>> | SpecificResourceV4;

export function createRangeHelper(vault: CompatVault = compatVault) {
  return {
    findFirstCanvasFromRange: (range: RangeNormalizedV3 | RangeNormalizedV4) => findFirstCanvasFromRange(vault, range),
    findAllCanvasesInRange: (range: RangeNormalizedV3 | RangeNormalizedV4) => findAllCanvasesInRange(vault, range),
    findAllContainersInRange: (range: RangeNormalizedV3 | RangeNormalizedV4) => findAllContainersInRange(vault, range),
    findManifestSelectedRange: (manifest: ManifestNormalizedV3 | ManifestNormalizedV4, canvasId: string) =>
      findManifestSelectedRange(vault, manifest, canvasId),
    findSelectedRange: (range: RangeNormalizedV3 | RangeNormalizedV4, canvasId: string) =>
      findSelectedRange(vault, range, canvasId),
    rangesToTableOfContentsTree: (
      rangeRefs: Array<RangeNormalizedV3 | RangeNormalizedV4>,
      label?: InternationalString | null,
      options: { showNoNav?: boolean } = {}
    ) => rangesToTableOfContentsTree(vault, rangeRefs, label, options),
    rangeToTableOfContentsTree: (
      rangeRef: RangeNormalizedV3 | RangeNormalizedV4 | Reference<'Range'>,
      options: { showNoNav?: boolean } = {}
    ) => rangeToTableOfContentsTree(vault, rangeRef, [], options),
    isContiguous: (
      rangeRef: RangeNormalizedV3 | RangeNormalizedV4 | Reference<'Range'>,
      canvasesRef: Array<CanvasV3 | CanvasV4 | CanvasNormalizedV3 | CanvasNormalizedV4 | Reference<'Canvas'>>,
      options: Partial<{ allowGaps: boolean; allowSubset: boolean; detail?: boolean }> = {}
    ) => isRangeContiguous(vault, rangeRef, canvasesRef, options),
  };
}

export function findFirstCanvasFromRange(
  vault: CompatVault,
  range: RangeNormalizedV3 | RangeNormalizedV4
): null | Reference<'Canvas'> {
  for (const inner of range.items) {
    const innerAny = inner as any;
    if (typeof inner === 'string') {
      return { id: inner, type: 'Canvas' };
    }
    if (innerAny.type === 'Canvas') {
      return inner as any as Reference<'Canvas'>;
    }
    if (innerAny.type === 'SpecificResource') {
      if (innerAny.source?.type === 'Canvas') {
        return innerAny.source as Reference<'Canvas'>;
      }
    }
    if (innerAny.type === 'Range') {
      const found = findFirstCanvasFromRange(vault, vault.get(inner as any) as any);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function findFirstCanvasFromRangeWithSelector(
  vault: CompatVault,
  range: RangeNormalizedV3 | RangeNormalizedV4
): null | SpecificCanvasResource {
  for (const inner of range.items) {
    const innerAny = inner as any;
    if (typeof inner === 'string') {
      return {
        type: 'SpecificResource',
        source: { id: inner, type: 'Canvas' } as Reference<'Canvas'>,
      };
    }
    if (innerAny.type === 'Canvas') {
      return {
        type: 'SpecificResource',
        source: inner as any as Reference<'Canvas'>,
      };
    }
    if (innerAny.type === 'SpecificResource') {
      if (innerAny.source?.type === 'Canvas') {
        return inner as SpecificCanvasResource;
      }
    }
    if (innerAny.type === 'Range') {
      const found = findFirstCanvasFromRangeWithSelector(vault, vault.get(inner as any) as any);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function findAllCanvasesInRange(
  vault: CompatVault,
  range: RangeNormalizedV3 | RangeNormalizedV4
): Array<Reference<'Canvas'>> {
  return findAllContainersInRange(vault, range).filter(
    (container): container is Reference<'Canvas'> => container.type === 'Canvas'
  );
}

export function findAllContainersInRange(
  vault: CompatVault,
  range: RangeNormalizedV3 | RangeNormalizedV4
): ContainerReference[] {
  const found = new Map<string, ContainerReference>();
  const visitedRanges = new Set<string>();

  const add = (id: string | undefined, type: ContainerType) => {
    if (!id) return;
    const [canvasId] = type === 'Canvas' ? splitCanvasFragment(id) : [id];
    found.set(`${type}:${canvasId}`, { id: canvasId, type } as ContainerReference);
  };

  const visit = (current: RangeNormalizedV3 | RangeNormalizedV4) => {
    if (current.id) {
      if (visitedRanges.has(current.id)) return;
      visitedRanges.add(current.id);
    }

    for (const inner of current.items || []) {
      if (typeof inner === 'string') {
        add(inner, 'Canvas');
        continue;
      }

      const item = inner as any;
      if (item.type === 'Range') {
        const nested = vault.get(item as any) as RangeNormalizedV3 | RangeNormalizedV4 | undefined;
        if (nested?.items) visit(nested);
        continue;
      }

      if (item.type === 'SpecificResource') {
        const source = item.source;
        if (typeof source === 'string') {
          add(source, 'Canvas');
        } else if (source && (source.type === 'Canvas' || source.type === 'Timeline' || source.type === 'Scene')) {
          add(source.id, source.type);
        }
        continue;
      }

      if (item.type === 'Canvas' || item.type === 'Timeline' || item.type === 'Scene') {
        add(item.id, item.type);
      }
    }
  };

  visit(range);
  return [...found.values()];
}

export function findManifestSelectedRange(
  vault: CompatVault,
  manifest: ManifestNormalizedV3 | ManifestNormalizedV4,
  canvasId: string
): null | RangeNormalizedV3 | RangeNormalizedV4 {
  for (const range of manifest.structures) {
    const found = findSelectedRange(vault, vault.get(range), canvasId);
    if (found) {
      return found;
    }
  }

  return null;
}

export function findSelectedRange(
  vault: CompatVault,
  range: RangeNormalizedV3 | RangeNormalizedV4,
  canvasId: string
): null | RangeNormalizedV3 | RangeNormalizedV4 {
  for (const inner of range.items) {
    const innerAny = inner as any;
    const parsedId = (inner as any)?.source?.id?.split('#')[0];
    if (innerAny.type === 'SpecificResource' && innerAny.source === canvasId) {
      return range;
    }
    if (innerAny.type === 'SpecificResource' && innerAny.source?.type === 'Canvas' && canvasId === parsedId) {
      return range;
    }
    if (innerAny.type === 'Range') {
      const found = findSelectedRange(vault, vault.get(inner as any) as any, canvasId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export interface RangeTableOfContentsNode {
  id: string;
  type: 'Canvas' | 'Range';
  label: InternationalString | null;
  resource?: AnySpecificResource;
  untitled?: boolean;
  isCanvasLeaf: boolean;
  isRangeLeaf: boolean;
  isVirtual?: boolean;
  isNoNav?: boolean;
  firstCanvas?: SpecificCanvasResource | null;
  items?: Array<RangeTableOfContentsNode>;
  parent?: { id: string; type: 'Range' };
}

export function rangesToTableOfContentsTree(
  vault: CompatVault,
  rangeRefs: Array<RangeNormalizedV3 | RangeNormalizedV4 | RangeV3 | RangeV4 | Reference<'Range'>>,
  label?: InternationalString | null,
  options: { showNoNav?: boolean } = {}
): RangeTableOfContentsNode | null {
  if (rangeRefs.length === 0) {
    return null;
  }

  const ranges = vault.get(rangeRefs);

  if (ranges.length === 1) {
    return rangeToTableOfContentsTree(vault, ranges[0] as any, [], options);
  }

  const virtualRoot: RangeV3 = {
    id: `vault://virtual-root/${hash(ranges)}`,
    type: 'Range',
    label: label || { en: ['Table of Contents'] },
    items: ranges as any,
  };

  return rangeToTableOfContentsTree(vault, virtualRoot, [], options);
}

export function rangeToTableOfContentsTree(
  vault: CompatVault,
  rangeRef: undefined | null | RangeLike,
  seenIds: string[] = [],
  options: { showNoNav?: boolean; parentRange?: { id: string; type: 'Range' } } = {}
): RangeTableOfContentsNode | null {
  if (!rangeRef) return null;

  const range = vault.get(rangeRef, { skipSelfReturn: false });
  const toc: RangeTableOfContentsNode = {
    id: range.id,
    type: 'Range',
    label: range.label,
    untitled: !range.label,
    isCanvasLeaf: false,
    isRangeLeaf: false,
    isVirtual: range.id.startsWith('vault://virtual-root/'),
    items: [],
    parent: options.parentRange,
  };

  if (seenIds.indexOf(toc.id) !== -1) {
    toc.id = `vault://${hash(range)}`;
  }

  if (range.behavior && range.behavior.includes('no-nav')) {
    if (options.showNoNav) {
      toc.isNoNav = true;
    } else {
      return null;
    }
  }

  if (!range.items) {
    return toc;
  }

  for (const inner of range.items) {
    if (typeof inner === 'string') {
      const maybeCanvas = vault.get({ id: inner, type: 'Canvas' }, { skipSelfReturn: false });
      const foundCanvas: RangeTableOfContentsNode = {
        id: inner,
        type: 'Canvas',
        isCanvasLeaf: true,
        isRangeLeaf: false,
        isNoNav: range.behavior && range.behavior.includes('no-nav'),
        label: maybeCanvas.label || { none: ['Untitled'] },
        untitled: !maybeCanvas.label,
        resource: {
          type: 'SpecificResource',
          source: { id: inner, type: 'Canvas' },
        },
        parent: { id: toc.id, type: 'Range' },
      };

      if (seenIds.indexOf(foundCanvas.id) !== -1) {
        foundCanvas.id = `vault://${hash(inner)}`;
      }

      seenIds.push(foundCanvas.id);

      toc.items!.push(foundCanvas);
      continue;
    }
    if (inner.type === 'SpecificResource' && inner.source?.type === 'Canvas') {
      const maybeCanvas = vault.get(inner.source);
      const compressed = compressSpecificResource(inner);

      if (!maybeCanvas) {
        continue;
      }

      const foundCanvas: RangeTableOfContentsNode = {
        id: compressed.type === 'Canvas' ? compressed.id : inner.source.id,
        type: 'Canvas',
        isCanvasLeaf: true,
        isRangeLeaf: false,
        label: maybeCanvas.label || { none: ['Untitled'] },
        untitled: !maybeCanvas.label,
        resource: inner,
        parent: { id: toc.id, type: 'Range' },
      };
      if (seenIds.indexOf(foundCanvas.id) !== -1) {
        foundCanvas.id = `vault://${hash(inner)}`;
      }

      seenIds.push(foundCanvas.id);

      toc.items!.push(foundCanvas);
      continue;
    }
    if ((inner as any).type === 'Canvas') {
      const foundCanvas: RangeTableOfContentsNode = {
        id: (inner as any).id,
        type: 'Canvas',
        label: (inner as any).label,
        isCanvasLeaf: true,
        isRangeLeaf: false,
        resource: {
          type: 'SpecificResource',
          source: inner as any,
        },
        parent: { id: toc.id, type: 'Range' },
      };

      if (seenIds.indexOf(foundCanvas.id) !== -1) {
        foundCanvas.id = `vault://${hash(inner)}`;
      }

      seenIds.push(foundCanvas.id);

      toc.items!.push(foundCanvas);
      continue;
    }
    if ((inner as any).type === 'Range') {
      const foundRange = rangeToTableOfContentsTree(vault, inner as any, seenIds, {
        ...options,
        parentRange: { id: toc.id, type: 'Range' },
      });
      if (foundRange) {
        toc.items!.push(foundRange);
      }
    }
  }

  toc.firstCanvas = findFirstCanvasFromRangeWithSelector(vault, range);
  toc.isRangeLeaf = toc.items ? toc.items.filter((i) => i.type === 'Range').length === 0 : true;

  return toc;
}

function getCanvasesFromRange(
  vault: CompatVault,
  rangeRef: RangeLike,
  path: string[] = []
): Array<{ canvas: CanvasLike; path: string[] }> {
  const range = vault.get(rangeRef);
  const canvases: Array<{ canvas: CanvasLike; path: string[] }> = [];
  const currentPath = range.id ? [...path, range.id] : path;

  if (!range.items) {
    return canvases;
  }

  for (const item of range.items) {
    if (typeof item === 'string') {
      canvases.push({ canvas: { id: item, type: 'Canvas' }, path: currentPath });
    } else if (item.type === 'SpecificResource') {
      const canvas = item.source;
      if (canvas?.type === 'Canvas') {
        canvases.push({ canvas: canvas as CanvasLike, path: currentPath });
      } else {
        // Unknown resource type.
      }
    } else if (item.type === 'Range') {
      canvases.push(...getCanvasesFromRange(vault, item as RangeLike, currentPath));
    } else if ((item as any).type === 'Canvas' || (item as any).type === 'Timeline' || (item as any).type === 'Scene') {
      // P4 normalization stores container references directly (not wrapped in SpecificResource)
      canvases.push({ canvas: item as unknown as CanvasLike, path: currentPath });
    }
  }
  return canvases;
}

type IsRangeContiguousDetail = {
  isContiguous: boolean;
  startIndex: number;
  endIndex: number;
  gaps: Array<{
    startIndex: number;
    endIndex: number;
    canvasIds: string[];
  }>;
  invalidRanges: Array<{ id: string; reasons: string[] }>;
  invalidCanvases: string[];
  reason: string | null;
};

export function isRangeContiguous(
  vault: CompatVault,
  rangeRef: RangeLike,
  canvasesRef: Array<CanvasV3 | CanvasV4 | CanvasNormalizedV3 | CanvasNormalizedV4 | Reference<'Canvas'>>,
  options: Partial<{ allowGaps: boolean; allowSubset: boolean; detail?: boolean }> = {}
): [boolean, IsRangeContiguousDetail | null] {
  const canvases = canvasesRef.map((c) => vault.get(c, { skipSelfReturn: false }));
  const range = vault.get(rangeRef);
  const allCanvasIds = canvases.map((c) => c.id);
  const rangeCanvases = getCanvasesFromRange(vault, range);
  const details: IsRangeContiguousDetail = {
    isContiguous: true,
    startIndex: -1,
    endIndex: -1,
    gaps: [],
    invalidRanges: [],
    invalidCanvases: [],
    reason: null,
  };

  if (rangeCanvases.length === 0) {
    if (options.detail) {
      return [true, details];
    }
    return [true, null];
  }

  const indices = rangeCanvases.map(({ canvas }) => allCanvasIds.indexOf(canvas.id));

  let isContiguous = true;

  let lastIndex = -1;
  const rangeInvalidReasons = new Map<string, string[]>();

  const markRangeInvalid = (id: string, reason: string) => {
    if (!rangeInvalidReasons.has(id)) {
      rangeInvalidReasons.set(id, []);
    }
    const currentInvalid = rangeInvalidReasons.get(id)!;
    if (currentInvalid.includes(reason)) {
      return;
    }
    currentInvalid.push(reason);
  };

  for (let i = 0; i < indices.length; i++) {
    const currentIndex = indices[i];
    const canvasInfo = rangeCanvases[i];
    const parentRangeId = canvasInfo.path[canvasInfo.path.length - 1];

    if (currentIndex === -1) {
      isContiguous = false;
      if (parentRangeId) {
        markRangeInvalid(parentRangeId, 'Canvas not found');
      }
      details.invalidCanvases.push(canvasInfo.canvas.id);
      continue;
    }

    if (i > 0 && lastIndex !== -1) {
      if (currentIndex <= lastIndex) {
        isContiguous = false;
        if (parentRangeId) {
          markRangeInvalid(parentRangeId, 'Canvas out of order');
        }
        // Don't update last index.
      } else {
        const diff = currentIndex - lastIndex;
        if (diff > 1) {
          if (!options.allowGaps) {
            isContiguous = false;
          }
          if (options.detail) {
            details.gaps.push({
              startIndex: lastIndex,
              endIndex: currentIndex,
              canvasIds: allCanvasIds.slice(lastIndex + 1, currentIndex),
            });
          }
        }
        lastIndex = currentIndex;
      }
    } else {
      lastIndex = currentIndex;
    }
  }

  if (!options.allowSubset) {
    if (rangeCanvases.length !== allCanvasIds.length) {
      isContiguous = false;
    } else {
      const allFound = allCanvasIds.every((id) => rangeCanvases.some((rc) => rc.canvas.id === id));
      if (!allFound) {
        isContiguous = false;
      }
    }
  }

  if (!options.detail) {
    return [isContiguous, null];
  }

  const invalidRangeIds = Array.from(rangeInvalidReasons.keys());
  if (invalidRangeIds.length > 0) {
    details.invalidRanges = invalidRangeIds.map((id) => ({
      id,
      reasons: rangeInvalidReasons.get(id) || [],
    }));
  }

  const result: IsRangeContiguousDetail = { ...details, isContiguous };

  const validIndices = indices.filter((i) => i !== -1);
  if (validIndices.length > 0) {
    result.startIndex = validIndices[0];
    result.endIndex = validIndices[validIndices.length - 1];
  }

  return [isContiguous, result];
}
