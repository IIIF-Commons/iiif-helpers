import { Range, InternationalString, Reference, SpecificResource } from '@iiif/presentation-3';
import { ManifestNormalized, RangeNormalized } from '@iiif/presentation-3-normalized';
import { CompatVault, compatVault } from './compat';
import { compressSpecificResource } from '@iiif/parser';
import { hash } from './shared-utilities';

export function createRangeHelper(vault: CompatVault = compatVault) {
  return {
    findFirstCanvasFromRange: (range: RangeNormalized) => findFirstCanvasFromRange(vault, range),
    findAllCanvasesInRange: (range: RangeNormalized) => findAllCanvasesInRange(vault, range),
    findManifestSelectedRange: (manifest: ManifestNormalized, canvasId: string) =>
      findManifestSelectedRange(vault, manifest, canvasId),
    findSelectedRange: (range: RangeNormalized, canvasId: string) => findSelectedRange(vault, range, canvasId),
    rangesToTableOfContentsTree: (rangeRefs: RangeNormalized[], label?: InternationalString | null) =>
      rangesToTableOfContentsTree(vault, rangeRefs, label),
    rangeToTableOfContentsTree: (rangeRef: RangeNormalized | Reference<'Range'>) =>
      rangeToTableOfContentsTree(vault, rangeRef),
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
      return { type: 'SpecificResource', source: { id: inner, type: 'Canvas' } as Reference<'Canvas'> };
    }
    if ((inner as any).type === 'Canvas') {
      return { type: 'SpecificResource', source: inner as any as Reference<'Canvas'> };
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
      if (inner.source.id.indexOf('#') !== -1) {
        found.push({ id: inner.source.id.split('#')[0], type: 'Canvas' });
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
  firstCanvas?: SpecificResource<Reference<'Canvas'>> | null;
  items?: Array<RangeTableOfContentsNode>;
}

export function rangesToTableOfContentsTree(
  vault: CompatVault,
  rangeRefs: RangeNormalized[] | Range[] | Reference<'Range'>[],
  label?: InternationalString | null
): RangeTableOfContentsNode | null {
  if (rangeRefs.length === 0) {
    return null;
  }

  const ranges = vault.get(rangeRefs);

  if (ranges.length === 1) {
    return rangeToTableOfContentsTree(vault, ranges[0] as any);
  }

  const virtualRoot: Range = {
    id: `vault://virtual-root/${hash(ranges)}`,
    type: 'Range',
    label: label || { en: ['Table of Contents'] },
    items: ranges as any,
  };

  return rangeToTableOfContentsTree(vault, virtualRoot);
}

export function rangeToTableOfContentsTree(
  vault: CompatVault,
  rangeRef: undefined | null | Range | RangeNormalized | Reference<'Range'>,
  seenIds: string[] = []
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
    items: [],
  };

  if (seenIds.indexOf(toc.id) !== -1) {
    toc.id = `vault://${hash(range)}`;
  }

  if (!range.items) {
    return toc;
  }

  if (range.behavior && range.behavior.includes('no-nav')) {
    return null;
  }

  for (const inner of range.items) {
    if (typeof inner === 'string') {
      const maybeCanvas = vault.get({ id: inner, type: 'Canvas' }, { skipSelfReturn: false });
      const foundCanvas: RangeTableOfContentsNode = {
        id: inner,
        type: 'Canvas',
        isCanvasLeaf: true,
        isRangeLeaf: false,
        label: maybeCanvas.label || { none: ['Untitled'] },
        untitled: !maybeCanvas.label,
        resource: {
          type: 'SpecificResource',
          source: { id: inner, type: 'Canvas' },
        },
      };

      if (seenIds.indexOf(foundCanvas.id) !== -1) {
        foundCanvas.id = `vault://${hash(inner)}`;
      }

      seenIds.push(foundCanvas.id);
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
      };

      if (seenIds.indexOf(foundCanvas.id) !== -1) {
        foundCanvas.id = `vault://${hash(inner)}`;
      }

      seenIds.push(foundCanvas.id);
      continue;
    }
    if ((inner as any).type === 'Range') {
      const foundRange = rangeToTableOfContentsTree(vault, inner as any, seenIds);
      if (foundRange) {
        toc.items!.push(foundRange);
      }
      continue;
    }
  }

  toc.firstCanvas = findFirstCanvasFromRangeWithSelector(vault, range);
  toc.isRangeLeaf = toc.items ? toc.items.filter((i) => i.type === 'Range').length === 0 : true;

  return toc;
}
