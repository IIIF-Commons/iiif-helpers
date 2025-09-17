// Test utility.

import { emptyManifest } from '@iiif/parser';
import type { Manifest, Range, RangeItems } from '@iiif/presentation-3';
import { getValue, type RangeTableOfContentsNode } from '../src';

// Render range in ascii with children + indentation.
const treeChars = {
  vertical: '│',
  horizontal: '─',
  corner: '└',
  tee: '├',
  space: ' ',
};

export const copy = (obj: any) => JSON.parse(JSON.stringify(obj));

export type RangeMakerHelper = {
  range: (id: string, items: any[]) => Range;
  canvas: (id: string) => RangeItems;
  gap: (id: string) => RangeItems;
};

export function rangeMaker(fn: (r: RangeMakerHelper) => Range): [
  Range,
  {
    canvasIds: string[];
    getManifest(): Manifest;
    canvases: Array<{ id: string; type: 'Canvas' }>;
  },
] {
  const canvasIds: string[] = [];
  const ctx = {
    range: (id: string, items: any[]) => {
      return {
        id,
        type: 'Range',
        items: items.filter((t) => t !== null),
      } as Range;
    },
    gap: (id: string) => {
      canvasIds.push(id);
      return null;
    },
    canvas: (id: string) => {
      canvasIds.push(id);
      return {
        id,
        type: 'Canvas',
      } as RangeItems;
    },
  };
  const response = fn(ctx as any);
  return [
    response as Range,
    {
      canvasIds,
      getManifest(): Manifest {
        return {
          ...(emptyManifest as any),
          id: 'https://example.org/manifest',
          label: { en: ['Manifest'] },
          items: canvasIds.map((c, idx) => ({
            id: c,
            type: 'Canvas' as const,
            width: 1000,
            height: 1000,
            label: { en: [`Canvas ${idx}`] },
          })),
          structures: [response],
        };
      },
      canvases: canvasIds.map((c) => ({ id: c, type: 'Canvas' as const })),
    },
  ] as const;
}

export function renderRange(range: RangeTableOfContentsNode | null, skipCanvases = false, indent = 0) {
  if (!range) {
    return '';
  }
  const spaces = treeChars.space.repeat(indent);
  let str = `${getValue(range.label)}\n`;
  const itemsCount = range.items ? range.items.length : 0;
  range.items?.forEach((item, index) => {
    const isLastItem = index === itemsCount - 1;
    if (item.isCanvasLeaf && skipCanvases) return;
    if (typeof item === 'string') {
      str += `${spaces}${isLastItem ? treeChars.corner : treeChars.tee}${treeChars.horizontal}${treeChars.horizontal} ${item}\n`;
    } else {
      str += `${spaces}${isLastItem ? treeChars.corner : treeChars.tee}${treeChars.horizontal}${treeChars.horizontal} ${renderRange(item, skipCanvases, indent + 2)}`;
    }
  });
  return str;
}
