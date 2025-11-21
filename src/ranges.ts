import { compressSpecificResource } from '@iiif/parser';
import type { Canvas, InternationalString, Manifest, Range, Reference, SpecificResource } from '@iiif/presentation-3';
import type { CanvasNormalized, ManifestNormalized, RangeNormalized } from '@iiif/presentation-3-normalized';
import { splitCanvasFragment } from './annotation-targets';
import { type CompatVault, compatVault } from './compat';
import { hash } from './shared-utilities';

export function createRangeHelper(vault: CompatVault = compatVault) {
  return {
    findFirstCanvasFromRange: (range: RangeNormalized) => findFirstCanvasFromRange(vault, range),
    findAllCanvasesInRange: (range: RangeNormalized) => findAllCanvasesInRange(vault, range),
    findManifestSelectedRange: (manifest: ManifestNormalized, canvasId: string) =>
      findManifestSelectedRange(vault, manifest, canvasId),
    findSelectedRange: (range: RangeNormalized, canvasId: string) => findSelectedRange(vault, range, canvasId),
    rangesToTableOfContentsTree: (
      rangeRefs: RangeNormalized[],
      label?: InternationalString | null,
      options: { showNoNav?: boolean } = {}
    ) => rangesToTableOfContentsTree(vault, rangeRefs, label, options),
    rangeToTableOfContentsTree: (
      rangeRef: RangeNormalized | Reference<'Range'>,
      options: { showNoNav?: boolean } = {}
    ) => rangeToTableOfContentsTree(vault, rangeRef, [], options),
    isContiguous: (
      rangeRef: RangeNormalized | Reference<'Range'>,
      canvasesRef: Canvas[] | CanvasNormalized[] | Reference<'Canvas'>[],
      options: Partial<{ allowGaps: boolean; allowSubset: boolean; detail?: boolean }> = {}
    ) => isRangeContiguous(vault, rangeRef, canvasesRef, options),
  };
}

export function findFirstCanvasFromRange(vault: CompatVault, range: RangeNormalized): null | Reference<'Canvas'> {
  for (const inner of range.items) {
    if (typeof inner === 'string') {
      return { id: inner, type: 'Canvas' };
    }
    if ((inner as any).type === 'Canvas') {
      return inner as any as Reference<'Canvas'>;
    }
    if (inner.type === 'SpecificResource') {
      if (inner.source?.type === 'Canvas') {
        return inner.source as Reference<'Canvas'>;
      }
    }
    if (inner.type === 'Range') {
      const found = findFirstCanvasFromRange(vault, vault.get(inner));
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function findFirstCanvasFromRangeWithSelector(
  vault: CompatVault,
  range: RangeNormalized
): null | SpecificResource<Reference<'Canvas'>> {
  for (const inner of range.items) {
    if (typeof inner === 'string') {
      return {
        type: 'SpecificResource',
        source: { id: inner, type: 'Canvas' } as Reference<'Canvas'>,
      };
    }
    if ((inner as any).type === 'Canvas') {
      return {
        type: 'SpecificResource',
        source: inner as any as Reference<'Canvas'>,
      };
    }
    if (inner.type === 'SpecificResource') {
      if (inner.source?.type === 'Canvas') {
        return inner as SpecificResource<Reference<'Canvas'>>;
      }
    }
    if (inner.type === 'Range') {
      const found = findFirstCanvasFromRangeWithSelector(vault, vault.get(inner));
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function findAllCanvasesInRange(vault: CompatVault, range: RangeNormalized): Array<Reference<'Canvas'>> {
  const found: Reference<'Canvas'>[] = [];
  for (const inner of range.items) {
    if (inner.type === 'SpecificResource' && inner.source?.type === 'Canvas') {
      const [url, fragment] = splitCanvasFragment(inner.source.id || '');
      if (fragment) {
        found.push({ id: url, type: 'Canvas' });
      } else {
        found.push(inner.source as Reference<'Canvas'>);
      }
    }
    if (inner.type === 'Range') {
      found.push(...findAllCanvasesInRange(vault, vault.get(inner)));
    }
    if ((inner as any).type === 'SpecificResource') {
      const sourceId = typeof (inner as any).source === 'string' ? (inner as any).source : (inner as any).source.id;
      found.push({ id: sourceId, type: 'Canvas' });
    }
  }
  return found;
}

export function findManifestSelectedRange(
  vault: CompatVault,
  manifest: ManifestNormalized,
  canvasId: string
): null | RangeNormalized {
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
  range: RangeNormalized,
  canvasId: string
): null | RangeNormalized {
  for (const inner of range.items) {
    const parsedId = (inner as any)?.source?.id?.split('#')[0];
    if ((inner as any).type === 'SpecificResource' && (inner as any).source === canvasId) {
      return range;
    }
    if (inner.type === 'SpecificResource' && inner.source?.type === 'Canvas' && canvasId === parsedId) {
      return range;
    }
    if (inner.type === 'Range') {
      const found = findSelectedRange(vault, vault.get(inner), canvasId);
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
  resource?: SpecificResource;
  untitled?: boolean;
  isCanvasLeaf: boolean;
  isRangeLeaf: boolean;
  isVirtual?: boolean;
  isNoNav?: boolean;
  firstCanvas?: SpecificResource<Reference<'Canvas'>> | null;
  items?: Array<RangeTableOfContentsNode>;
  parent?: { id: string; type: 'Range' };
}

export function rangesToTableOfContentsTree(
  vault: CompatVault,
  rangeRefs: RangeNormalized[] | Range[] | Reference<'Range'>[],
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

  const virtualRoot: Range = {
    id: `vault://virtual-root/${hash(ranges)}`,
    type: 'Range',
    label: label || { en: ['Table of Contents'] },
    items: ranges as any,
  };

  return rangeToTableOfContentsTree(vault, virtualRoot, [], options);
}

export function rangeToTableOfContentsTree(
  vault: CompatVault,
  rangeRef: undefined | null | Range | RangeNormalized | Reference<'Range'>,
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
  rangeRef: Range | RangeNormalized | Reference<'Range'>,
  path: string[] = []
): Array<{ canvas: Canvas; path: string[] }> {
  const range = vault.get(rangeRef);
  const canvases: Array<{ canvas: Canvas; path: string[] }> = [];
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
        canvases.push({ canvas: canvas as Canvas, path: currentPath });
      } else {
        // Unknown resource type.
      }
    } else if (item.type === 'Range') {
      canvases.push(...getCanvasesFromRange(vault, item as Range, currentPath));
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
  rangeRef: Range | RangeNormalized | Reference<'Range'>,
  canvasesRef: Canvas[] | CanvasNormalized[] | Reference<'Canvas'>[],
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
