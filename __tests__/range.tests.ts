import type { Range, RangeItems } from '@iiif/presentation-3';
import type { ManifestNormalized } from '@iiif/presentation-3-normalized';
import invariant from 'tiny-invariant';
import tableOfContentManifests from '../fixtures/cookbook/toc.json';
import tableOfContentsAvManifest from '../fixtures/cookbook/toc-av.json';
import bodleian from '../fixtures/presentation-2/bodleian.json';
import wellcomeRange from '../fixtures/presentation-2/wellcome-range.json';
import blManifest from '../fixtures/presentation-3/bl-av-manifest.json';
import {
  getValue,
  isRangeContiguous,
  type RangeTableOfContentsNode,
  rangesToTableOfContentsTree,
  rangeToTableOfContentsTree,
  Vault,
} from '../src';
import { emptyManifest } from '@iiif/parser';

// Test utility.
// Render range in ascii with children + indentation.
const treeChars = {
  vertical: '│',
  horizontal: '─',
  corner: '└',
  tee: '├',
  space: ' ',
};

const copy = (obj: any) => JSON.parse(JSON.stringify(obj));

type RangeMakerHelper = {
  range: (id: string, items: any[]) => Range;
  canvas: (id: string) => RangeItems;
  gap: (id: string) => RangeItems;
};

function rangeMaker(fn: (r: RangeMakerHelper) => Range) {
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
    response,
    {
      canvasIds,
      getManifest() {
        return {
          ...emptyManifest,
          id: 'https://example.org/manifest',
          label: { en: 'Manifest' },
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

function renderRange(range: RangeTableOfContentsNode | null, skipCanvases = false, indent = 0) {
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

describe('range helper', () => {
  describe('rangeToTableOfContentsTree', () => {
    test('it can make a table of contents tree', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, copy(tableOfContentManifests));

      invariant(manifest);

      const tree = rangeToTableOfContentsTree(vault, manifest.structures[0] as any);

      expect(renderRange(tree)).toMatchInlineSnapshot(`
        "Table of Contents
        ├── Tabiba Tabiban [ጠቢበ ጠቢባን]
          ├── f. 1r
          └── f. 1v
        └── Arede'et [አርድዕት]
          ├── Monday
            ├── f. 2r
            └── f. 2v
          └── Tuesday
            ├── f. 3r
            └── f. 3v
        "
      `);
      //todo
      expect(tree).toMatchInlineSnapshot(`
        {
          "firstCanvas": {
            "selector": undefined,
            "source": {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p1",
              "type": "Canvas",
            },
            "type": "SpecificResource",
          },
          "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r0",
          "isCanvasLeaf": false,
          "isRangeLeaf": false,
          "items": [
            {
              "firstCanvas": {
                "selector": undefined,
                "source": {
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p1",
                  "type": "Canvas",
                },
                "type": "SpecificResource",
              },
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r1",
              "isCanvasLeaf": false,
              "isRangeLeaf": true,
              "items": [
                {
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p1",
                  "isCanvasLeaf": true,
                  "isRangeLeaf": false,
                  "label": {
                    "en": [
                      "f. 1r",
                    ],
                  },
                  "resource": {
                    "selector": undefined,
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p1",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "type": "Canvas",
                  "untitled": false,
                },
                {
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p2",
                  "isCanvasLeaf": true,
                  "isRangeLeaf": false,
                  "label": {
                    "en": [
                      "f. 1v",
                    ],
                  },
                  "resource": {
                    "selector": undefined,
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p2",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "type": "Canvas",
                  "untitled": false,
                },
              ],
              "label": {
                "gez": [
                  "Tabiba Tabiban [ጠቢበ ጠቢባን]",
                ],
              },
              "type": "Range",
              "untitled": false,
            },
            {
              "firstCanvas": {
                "selector": undefined,
                "source": {
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p3",
                  "type": "Canvas",
                },
                "type": "SpecificResource",
              },
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2",
              "isCanvasLeaf": false,
              "isRangeLeaf": false,
              "items": [
                {
                  "firstCanvas": {
                    "selector": undefined,
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p3",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/1",
                  "isCanvasLeaf": false,
                  "isRangeLeaf": true,
                  "items": [
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p3",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "en": [
                          "f. 2r",
                        ],
                      },
                      "resource": {
                        "selector": undefined,
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p3",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": false,
                    },
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p4",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "en": [
                          "f. 2v",
                        ],
                      },
                      "resource": {
                        "selector": undefined,
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p4",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": false,
                    },
                  ],
                  "label": {
                    "en": [
                      "Monday",
                    ],
                  },
                  "type": "Range",
                  "untitled": false,
                },
                {
                  "firstCanvas": {
                    "selector": undefined,
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p5",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/2",
                  "isCanvasLeaf": false,
                  "isRangeLeaf": true,
                  "items": [
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p5",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "en": [
                          "f. 3r",
                        ],
                      },
                      "resource": {
                        "selector": undefined,
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p5",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": false,
                    },
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p6",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "en": [
                          "f. 3v",
                        ],
                      },
                      "resource": {
                        "selector": undefined,
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p6",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": false,
                    },
                  ],
                  "label": {
                    "en": [
                      "Tuesday",
                    ],
                  },
                  "type": "Range",
                  "untitled": false,
                },
              ],
              "label": {
                "gez": [
                  "Arede'et [አርድዕት]",
                ],
              },
              "type": "Range",
              "untitled": false,
            },
          ],
          "label": {
            "en": [
              "Table of Contents",
            ],
          },
          "type": "Range",
          "untitled": false,
        }
      `);
    });

    test('it can make a table of contents tree', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, tableOfContentsAvManifest);

      invariant(manifest);

      const tree = rangeToTableOfContentsTree(vault, manifest.structures[0] as any);

      expect(renderRange(tree, true)).toMatchInlineSnapshot(`
        "Gaetano Donizetti, L'Elisir D'Amore
        ├── Atto Primo
          ├── Preludio e Coro d'introduzione – Bel conforto al mietitore
          └── Remainder of Atto Primo
        └── Atto Secondo
        "
      `);

      expect(tree).toMatchInlineSnapshot(`
        {
          "firstCanvas": {
            "selector": {
              "type": "FragmentSelector",
              "value": "t=0,302.05",
            },
            "source": {
              "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
              "type": "Canvas",
            },
            "type": "SpecificResource",
          },
          "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/range/1",
          "isCanvasLeaf": false,
          "isRangeLeaf": false,
          "items": [
            {
              "firstCanvas": {
                "selector": {
                  "type": "FragmentSelector",
                  "value": "t=0,302.05",
                },
                "source": {
                  "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                  "type": "Canvas",
                },
                "type": "SpecificResource",
              },
              "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/range/2",
              "isCanvasLeaf": false,
              "isRangeLeaf": false,
              "items": [
                {
                  "firstCanvas": {
                    "selector": {
                      "type": "FragmentSelector",
                      "value": "t=0,302.05",
                    },
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/range/3",
                  "isCanvasLeaf": false,
                  "isRangeLeaf": true,
                  "items": [
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=0,302.05",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "none": [
                          "Untitled",
                        ],
                      },
                      "resource": {
                        "selector": {
                          "type": "FragmentSelector",
                          "value": "t=0,302.05",
                        },
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": true,
                    },
                  ],
                  "label": {
                    "it": [
                      "Preludio e Coro d'introduzione – Bel conforto al mietitore",
                    ],
                  },
                  "type": "Range",
                  "untitled": false,
                },
                {
                  "firstCanvas": {
                    "selector": {
                      "type": "FragmentSelector",
                      "value": "t=302.05,3971.24",
                    },
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/range/4",
                  "isCanvasLeaf": false,
                  "isRangeLeaf": true,
                  "items": [
                    {
                      "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=302.05,3971.24",
                      "isCanvasLeaf": true,
                      "isRangeLeaf": false,
                      "label": {
                        "none": [
                          "Untitled",
                        ],
                      },
                      "resource": {
                        "selector": {
                          "type": "FragmentSelector",
                          "value": "t=302.05,3971.24",
                        },
                        "source": {
                          "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                          "type": "Canvas",
                        },
                        "type": "SpecificResource",
                      },
                      "type": "Canvas",
                      "untitled": true,
                    },
                  ],
                  "label": {
                    "en": [
                      "Remainder of Atto Primo",
                    ],
                  },
                  "type": "Range",
                  "untitled": false,
                },
              ],
              "label": {
                "it": [
                  "Atto Primo",
                ],
              },
              "type": "Range",
              "untitled": false,
            },
            {
              "firstCanvas": {
                "selector": {
                  "type": "FragmentSelector",
                  "value": "t=3971.24",
                },
                "source": {
                  "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                  "type": "Canvas",
                },
                "type": "SpecificResource",
              },
              "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/range/5",
              "isCanvasLeaf": false,
              "isRangeLeaf": true,
              "items": [
                {
                  "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=3971.24",
                  "isCanvasLeaf": true,
                  "isRangeLeaf": false,
                  "label": {
                    "none": [
                      "Untitled",
                    ],
                  },
                  "resource": {
                    "selector": {
                      "type": "FragmentSelector",
                      "value": "t=3971.24",
                    },
                    "source": {
                      "id": "https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1",
                      "type": "Canvas",
                    },
                    "type": "SpecificResource",
                  },
                  "type": "Canvas",
                  "untitled": true,
                },
              ],
              "label": {
                "it": [
                  "Atto Secondo",
                ],
              },
              "type": "Range",
              "untitled": false,
            },
          ],
          "label": {
            "it": [
              "Gaetano Donizetti, L'Elisir D'Amore",
            ],
          },
          "type": "Range",
          "untitled": false,
        }
      `);
    });

    test('it can make a table of contents tree', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(wellcomeRange['@id'], wellcomeRange);

      invariant(manifest);

      const tree = rangesToTableOfContentsTree(vault, manifest.structures);

      expect(renderRange(tree, true)).toMatchInlineSnapshot(`
        "Table of Contents
        ├── Cover
        ├── 'Precatio terrae matris,' abbreviated and corrupted
        ├── 'Precatio omnium herbarum,' abbreviated and corrupted
        ├── Antonius Musa, 'De herba vettonica'
        ├── Pseudo-Apuleius, 'Herbarius'
        ├── Anonymous, 'De taxone'
        ├── Sextus Placitus, 'De medicina ex animalibus,' (continues at f.76r)
        ├── 'Curae herbarum,' interpolated within the Sextus Placitus herbal
        ├── Receipts, interpolated within the Sextus Placitus herbal
        ├── Illustration
        ├── Sextus Placitus, 'De medicina ex animalibus,' (continued from f.46v)
        ├── Relation of a cure of a friend of the scribe
        ├── Tables of Roman and Arabic numerals from 1 to 1,000,000
        └── Cover
        "
      `);
    });

    test('it can parse BL manifest', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(blManifest.id, blManifest);

      invariant(manifest);

      const tree = rangesToTableOfContentsTree(vault, manifest.structures);

      expect(renderRange(tree, true)).toMatchInlineSnapshot(`
        "Wiltshire and Dorset, dub of disks / Fanny Rumble, A. Collins, Perrier (01:07:55)
        ├── The turmut hoeing (02:29)
        ├── She stole my heart away (02:08)
        ├── Dumble dum dollicky (Richard of Taunton Dean) (03:01)
        ├── Mrs Fanny Rumble talks about herself (01:44)
        ├── What shall I wear to the wedding, John? (03:25)
        ├── Country courtship (05:50)
        ├── Herbert Prince (05:00)
          ├── Introductory talk: 'The young sailor cut down in his prime' (01:25)
          └── The young sailor cut down in his prime (02:49)
        └── Fanny Rumble / Albert Collins / Fred Perrier (25:17)
          ├── O what shall I wear to the wedding, John? (03:57)
          ├── O what shall I wear to the wedding, John? (02:47)
          ├── The vly on the turmut (03:10)
          ├── The vly on the turmut (01:37)
          ├── Twas on a Monday morning (02:04)
          ├── Twas on a Monday morning (02:22)
          ├── Dumble dum dollicky (04:23)
          └── Talk about herself (01:53)
        "
      `);
    });

    test('very basic range', () => {
      const vault = new Vault();

      const [range, { getManifest }] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.canvas('https://example.org/canvas4'),
          c.canvas('https://example.org/canvas5'),
          c.canvas('https://example.org/canvas6'),
        ])
      );

      const manifest = getManifest();
      vault.loadSync(manifest.id, manifest);

      const toc = rangeToTableOfContentsTree(vault, range);

      expect(toc?.items?.length).toEqual(6);
    });
  });

  describe('isRangeContiguous', () => {
    test('simple contiguous range', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, copy(tableOfContentManifests));

      const firstRange = manifest?.structures[0]!;
      const canvases = manifest?.items!;

      const [isContiguous, details] = isRangeContiguous(vault, firstRange, canvases, { detail: true });

      expect(isContiguous).toBe(true);
      expect(details).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [],
          "invalidCanvases": [],
          "invalidRanges": [],
          "isContiguous": true,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('simple non-contiguous range with missing canvases', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, copy(tableOfContentManifests));

      const firstRange = manifest?.structures[0]!;
      const allCanvases = manifest?.items!;

      const canvases = [allCanvases[0], allCanvases[2], allCanvases[4]];

      const [isContiguous, details] = isRangeContiguous(vault, firstRange, canvases, { detail: true });

      expect(isContiguous).toBe(false);
      expect(details).toMatchInlineSnapshot(`
        {
          "endIndex": 2,
          "gaps": [],
          "invalidCanvases": [
            "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p2",
            "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p4",
            "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p6",
          ],
          "invalidRanges": [
            {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r1",
              "reasons": [
                "Canvas not found",
              ],
            },
            {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/1",
              "reasons": [
                "Canvas not found",
              ],
            },
            {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/2",
              "reasons": [
                "Canvas not found",
              ],
            },
          ],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('crafted range', () => {
      const vault = new Vault();

      const [range, { canvases }] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.canvas('https://example.org/canvas4'),
          c.canvas('https://example.org/canvas5'),
          c.canvas('https://example.org/canvas6'),
        ])
      );

      vault.loadSync(range.id, range);

      const [isContiguous, detail] = isRangeContiguous(vault, range, canvases, { detail: true });

      expect(isContiguous).toBe(true);

      expect(detail).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [],
          "invalidCanvases": [],
          "invalidRanges": [],
          "isContiguous": true,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('crafted range with gap', () => {
      const vault = new Vault();

      const [range, { canvases }] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.canvas('https://example.org/canvas4'),
          c.gap('https://example.org/canvas5'),
          c.canvas('https://example.org/canvas6'),
        ])
      );

      vault.loadSync(range.id, range);

      const [isContiguous, detail] = isRangeContiguous(vault, range, canvases, { detail: true });

      expect(isContiguous).toBe(false);

      expect(detail).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [
            {
              "canvasIds": [
                "https://example.org/canvas5",
              ],
              "endIndex": 5,
              "startIndex": 3,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('crafted range with gap (length=2)', () => {
      const vault = new Vault();

      const [range, { canvases }] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.gap('https://example.org/canvas4'),
          c.gap('https://example.org/canvas5'),
          c.canvas('https://example.org/canvas6'),
        ])
      );

      vault.loadSync(range.id, range);

      const [isContiguous, detail] = isRangeContiguous(vault, range, canvases, { detail: true });

      expect(isContiguous).toBe(false);

      expect(detail).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [
            {
              "canvasIds": [
                "https://example.org/canvas4",
                "https://example.org/canvas5",
              ],
              "endIndex": 5,
              "startIndex": 2,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('crafted range with gap (allowed)', () => {
      const vault = new Vault();

      const [range, { canvases }] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.gap('https://example.org/canvas4'),
          c.gap('https://example.org/canvas5'),
          c.canvas('https://example.org/canvas6'),
        ])
      );

      vault.loadSync(range.id, range);

      const [isContiguous, detail] = isRangeContiguous(vault, range, canvases, {
        allowSubset: true,
        allowGaps: true,
        detail: true,
      });

      expect(isContiguous).toBe(true);

      expect(detail).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [
            {
              "canvasIds": [
                "https://example.org/canvas4",
                "https://example.org/canvas5",
              ],
              "endIndex": 5,
              "startIndex": 2,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [],
          "isContiguous": true,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('crafted range out of order', () => {
      const vault = new Vault();

      const [range] = rangeMaker((c) =>
        c.range('https://example.org/range1', [
          c.canvas('https://example.org/canvas1'),
          c.canvas('https://example.org/canvas2'),
          c.canvas('https://example.org/canvas3'),
          c.canvas('https://example.org/canvas5'), // <--
          c.canvas('https://example.org/canvas4'), // <--
          c.canvas('https://example.org/canvas6'),
        ])
      );

      const canvases = [
        { id: 'https://example.org/canvas1', type: 'Canvas' as const },
        { id: 'https://example.org/canvas2', type: 'Canvas' as const },
        { id: 'https://example.org/canvas3', type: 'Canvas' as const },
        { id: 'https://example.org/canvas4', type: 'Canvas' as const },
        { id: 'https://example.org/canvas5', type: 'Canvas' as const },
        { id: 'https://example.org/canvas6', type: 'Canvas' as const },
      ];

      vault.loadSync(range.id, range);

      const [isContiguous, detail] = isRangeContiguous(vault, range, canvases, {
        allowSubset: true,
        allowGaps: true,
        detail: true,
      });

      expect(isContiguous).toBe(false);

      expect(detail).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [
            {
              "canvasIds": [
                "https://example.org/canvas4",
              ],
              "endIndex": 4,
              "startIndex": 2,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [
            {
              "id": "https://example.org/range1",
              "reasons": [
                "Canvas out of order",
              ],
            },
          ],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('simple non-contiguous range with valid canvases but out of order', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, copy(tableOfContentManifests));

      const firstRange = manifest?.structures[0]!;
      const allCanvases = manifest?.items!;

      const canvases = [
        //
        allCanvases[0],
        allCanvases[1],
        allCanvases[2],
        allCanvases[3],
        allCanvases[5],
        allCanvases[4],
      ];

      const [isContiguous, details] = isRangeContiguous(vault, firstRange, canvases, { detail: true });

      expect(isContiguous).toBe(false);
      expect(details).toMatchInlineSnapshot(`
        {
          "endIndex": 4,
          "gaps": [
            {
              "canvasIds": [
                "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p6",
              ],
              "endIndex": 5,
              "startIndex": 3,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [
            {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/2",
              "reasons": [
                "Canvas out of order",
              ],
            },
          ],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });

    test('simple non-contiguous range with valid canvases but out of order - different ranges', () => {
      const vault = new Vault();
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, copy(tableOfContentManifests));

      const firstRange = manifest?.structures[0]!;
      const allCanvases = manifest?.items!;

      const canvases = [
        //
        allCanvases[0],
        allCanvases[1],
        allCanvases[2],
        allCanvases[4],
        allCanvases[3],
        allCanvases[5],
      ];

      const [isContiguous, details] = isRangeContiguous(vault, firstRange, canvases, { detail: true });

      expect(isContiguous).toBe(false);
      expect(details).toMatchInlineSnapshot(`
        {
          "endIndex": 5,
          "gaps": [
            {
              "canvasIds": [
                "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/canvas/p5",
              ],
              "endIndex": 4,
              "startIndex": 2,
            },
          ],
          "invalidCanvases": [],
          "invalidRanges": [
            {
              "id": "https://iiif.io/api/cookbook/recipe/0024-book-4-toc/range/r2/2",
              "reasons": [
                "Canvas out of order",
              ],
            },
          ],
          "isContiguous": false,
          "reason": null,
          "startIndex": 0,
        }
      `);
    });
  });

  test('it can parse bodleian ranges', () => {
    const vault = new Vault();
    const manifest = vault.loadSync<ManifestNormalized>(bodleian['@id'], bodleian);

    invariant(manifest);

    expect(vault.get('https://iiif.bodleian.ox.ac.uk/iiif/range/390fd0e8-9eae-475d-9564-ed916ab9035c/LOG_0281'))
      .toMatchInlineSnapshot(`
      {
        "accompanyingCanvas": null,
        "annotations": [],
        "behavior": [],
        "homepage": [],
        "id": "https://iiif.bodleian.ox.ac.uk/iiif/range/390fd0e8-9eae-475d-9564-ed916ab9035c/LOG_0281",
        "iiif-parser:hasPart": [
          {
            "id": "https://iiif.bodleian.ox.ac.uk/iiif/range/390fd0e8-9eae-475d-9564-ed916ab9035c/LOG_0281",
            "iiif-parser:partOf": "https://iiif.bodleian.ox.ac.uk/iiif/range/390fd0e8-9eae-475d-9564-ed916ab9035c/LOG_0186",
            "type": "Range",
          },
        ],
        "items": [
          {
            "id": "https://iiif.bodleian.ox.ac.uk/iiif/range/390fd0e8-9eae-475d-9564-ed916ab9035c/LOG_0282",
            "type": "Range",
          },
        ],
        "label": {
          "none": [
            "The third Part of Henry the Sixt, with the death of the Duke of Yorke.",
          ],
        },
        "metadata": [
          {
            "label": {
              "none": [
                "Titles",
              ],
            },
            "value": {
              "none": [
                "The third Part of Henry the Sixt, with the death of the Duke of Yorke.",
              ],
            },
          },
          {
            "label": {
              "none": [
                "Image Range",
              ],
            },
            "value": {
              "none": [
                "fol. o4r–fol. q4v",
              ],
            },
          },
        ],
        "navDate": null,
        "partOf": [],
        "placeholderCanvas": null,
        "provider": [],
        "rendering": [],
        "requiredStatement": null,
        "rights": null,
        "seeAlso": [],
        "service": [],
        "start": {
          "id": "https://iiif.bodleian.ox.ac.uk/iiif/canvas/45778a2f-6cc6-4bfd-815e-4aeb3ddee222.json",
          "type": "Canvas",
        },
        "summary": null,
        "supplementary": null,
        "thumbnail": [],
        "type": "Range",
        "viewingDirection": "left-to-right",
      }
    `);

    expect(vault.get(manifest.structures)).toMatchSnapshot();

    const tree = rangesToTableOfContentsTree(vault, manifest.structures);
    expect(renderRange(tree, true)).toMatchInlineSnapshot(`
      "Arch. G c.7
      ├── [Front matter]
        ├── [Frontispiece]
        ├── [Title page]
        ├── [Preliminaries]
          ├── [Epistle Dedicatory]
          ├── To the great Variety of Readers.
          ├── To the memory of my beloued, The Avthor Mr. William Shakespeare: And what he hath left vs.
          ├── To the Memorie of the deceaſed Authour Maiſter W. Shakespeare.
          ├── [Works and Names of Actors]
          ├── Vpon the Lines and Life of the Famous Scenicke Poet, Maſter William Shakespeare.
      ├── [Comedies]
        ├── The Tempest.
          ├── Actus primus, Scena prima.
          ├── [Act 1] Scena Sec[unda].
          ├── Actus Secundus. Scœna Prima.
          ├── [Act 2] Scœna Secunda.
          ├── Actus Tertius. Scœna Prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scena Tertia.
          ├── Actus Quartus. Scena Prima.
          ├── Actus quintus: Scœna Prima.
          └── Epilogve
        ├── The Two Gentlemen of Verona.
          ├── Actus primus, Scena prima.
          ├── [Act 1] Scœna Secunda.
          ├── [Act 1] Scœna Tertia.
          ├── Actus ſecundus: Scœna Prima.
          ├── [Act 2] Scœna ſecunda.
          ├── [Act 2] Scœna Tertia.
          ├── [Act 2] Scena Quarta.
          ├── [Act 2] Scena Quinta.
          ├── [Act 2] Scœna Sexta.
          ├── [Act 2] Scœna ſeptima.
          ├── Actus Tertius, Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── Actus Quartus. Scœna Prima.
          ├── [Act  4] Scœna Secunda.
          ├── [Act 4] Scœna Tertia.
          ├── [Act 4] Scena Quarta.
          ├── Actus Quintus. Scœna Prima.
          ├── [Act 5] Scœna Secunda.
          ├── [Act 5] Scena Tertia.
          ├── [Act 5] Scœna Quarta.
          └── The names of all the Actors.
        ├── The Merry Wiues of Windſor.
          ├── Actus primus, Scena prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scœna Quarta.
          ├── Actus Secundus, Scœna Prima.
          ├── [Act 2] Scœna Secunda.
          ├── [Act 2] Scena Tertia.
          ├── Actus Tertius. Scœna Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scena Tertia.
          ├── [Act 3] Scœna Quarta.
          ├── [Act 3] Scena Quinta.
          ├── Actus Quartus, Scœna Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── [Act 4] Scena Quinta.
          ├── [Act 4] Scena Sexta.
          ├── Actus Quintus. Scœna Prima.
          ├── [Act 5] Scena Secunda.
          ├── [Act 5] Scena Tertia.
          ├── [Act 5] Scena Quarta.
          └── [Act 5] Scena Quinta.
        ├── Measvre, For Measure.
          ├── Actus primus, Scena prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── [Act 1] Scena Quinta.
          ├── Actus Secundus. Scœna Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── Actus Quartus. Scœna Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── [Act 4] Scena Quinta.
          ├── [Act 4] Scena Sexta.
          ├── Actus Quintus. Scœna Prima.
          └── The names of all the Actors.
        ├── The Comedie of Errors.
          ├── Actus primus, Scena prima.
          ├── Actus Secundus.
          ├── Actus Tertius. Scena Prima.
          ├── Actus Quartus. Scœna Prima.
          └── Actus Quintus. Scœna Prima.
        ├── Much adoe about Nothing.
          ├── Actus primus, Scena prima.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── Loues Labour's loſt.
          ├── Actus primus.
          ├── Actus Secunda.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quartus.
        ├── A Midsommer Nights Dreame.
          ├── Actus primus.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── The Merchant of Venice.
          ├── Actus primus.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── As you Like it.
          ├── Actus primus. Scœna Prima.
          ├── [Act 1] Scœna Secunda.
          ├── [Act 1] Scena Tertius.
          ├── Actus Secundus. Scœna Pr[ima.]
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── [Act 2] Scena Sexta.
          ├── [Act 2] Scena Septima.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scœna Tertia.
          ├── [Act 3] Scœna Quarta.
          ├── [Act 3] Scena Quinta.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scœna Tertia.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scœna Secunda.
          ├── [Act 5] Scœna Tertia.
          ├── [Act 5] Scena Quarta.
          └── [Act 2] Scena Quinta.
        ├── The Taming of the Shrew.
          ├── Actus primus. Scœna Prima.
          ├── Actus Tertia.
          ├── Actus Quartus. Scena Prima.
          └── Actus Quintus.
        ├── All's Well, that Ends Well.
          ├── Actus primus. Scœna Prima.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── Twelfe Night, Or what you will.
          ├── Actus Primus, Scæna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scæna Tertia.
          ├── [Act 1] Scena Quarta.
          ├── [Act 1] Scena Quinta.
          ├── Actus Secundus, Scæna prima.
          ├── [Act 2] Scæna Secunda.
          ├── [Act 2] Scœna Tertia.
          ├── [Act 2] Scena Quarta.
          ├── [Act 2] Scena Quinta.
          ├── Actus Tertius, Scæna prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── [Act 3] Scœna Quarta.
          ├── Actus Quartus, Scæna prima.
          ├── [Act 4] Scœna Secunda.
          ├── [Act 4] Scæna Tertia.
          └── Actus Quintus. Scena Prima.
        ├── The Winters Tale
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scœna Secunda.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scæna Tertia.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scœna Secunda.
          └── The Names of the Actors.
      ├── Histories
        ├── The life and death of King Iohn.
          ├── Actus Primus, Scæna Prima.
          ├── [Act 1] Scæna Secunda.
          ├── Actus Secundus
          ├── Actus Tertius, Scæna prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── Actus Quartus, Scæna prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scœna Tertia.
          ├── Actus Quartus, Scæna prima.
          ├── [Act 5] Scœna Secunda.
          ├── [Act 5] Scæna Tertia.
          ├── [Act 5] Scena Quarta.
          ├── [Act 5] Scena Quinta.
          ├── [Act 5] Scena Sexta.
          └── [Act 5] Scena Septima.
        ├── The life and death of King Richard the Second.
          ├── Actus Primus, Scæna Prima.
          ├── [Act 1] Scæna Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scœna Quarta.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scæna Tertia.
          ├── [Act 2] Scœna Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── [Act 3] Scena Quarta.
          ├── Actus Quartus. Scœna Prima.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scœna Secunda.
          ├── [Act 5] Scœna Tertia.
          ├── [Act 5] Scæna Quarta.
          └── [Act 5] Scœna Quinta.
        ├── The Firſt Part of Henry the Fourth, with the Life and Death of Henry Sirnamed Hot-Spvrre.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scæna Secunda.
          ├── [Act 1] Scœna Tertia.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scæna Secunda.
          ├── [Act 2] Scœna Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scæna Secunda.
          ├── [Act 3] Scena Tertia.
          ├── Actus Quartus. Scœna Prima.
          ├── [Act 4] Scæna Secunda.
          ├── [Act 4] Scœna Tertia.
          ├── [Act 4] Scena Quarta.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scena Secunda.
          └── [Act 5] Scena Tertia.
        ├── The Second Part of Henry the Fourth, Containing his Death : and the Coronation of King Henry the Fift.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── Actus Secundus. Scœna Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scæna Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── Actus Quintus. Scœna Prima.
          ├── [Act 5] Scena Secunda.
          ├── [Act 5] Scena Tertia.
          ├── [Act 5] Scena Quarta.
          ├── [Act 5] Scena Quinta.
          ├── Epilogue.
          └── The Actors Names.
        ├── The Life of Henry the Fift.
          ├── Prologue.
          ├── Actus Primus. Scœna Prima.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── The firſt Part of Henry the Sixt.
          ├── Actus Primus. Scœna Prima.
          ├── Actus Secundus. Scena Prima.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── [Act 3] Scœna Quarta.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena ſecunda.
          ├── [Act 4] Scœna Tertia.
          ├── Actus Quintus.
        ├── The ſecond Part of Henry the Sixt, with the death of the Good Duke Hvmfrey.
          └── Actus Primus. Scœna Prima.
        ├── The third Part of Henry the Sixt, with the death of the Duke of Yorke.
          └── Actus Primus. Scœna Prima.
        ├── The Tragedy of Richard the Third : with the Landing of Earle Richmond, and the Battell at Boſworth Field.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── Actus Secundus. Scœna Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scœna Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scena Tertia.
          ├── [Act 3] Scæna Quarta.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── Actus Quintus. Scena Prima.
          └── [Act 5] Scena Secunda.
        └── The Famous Hiſtory of the Life of King Henry the Eight.
          ├── The Prologue.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scæna Tertia.
          ├── [Act 1] Scena Quarta.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scena Secunda.
          ├── [Act 5] Scena Tertia.
          ├── [Act 5] Scena Quarta.
          └── The Epilogue.
      ├── Tragedies
        ├── The Tragedie of Troylus and Creſsida.
          ├── The Prologue.
          └── Actus Primus. Scœna Prima.
        ├── The Tragedy of Coriolanus.
          ├── Actus Primus. Scœna Prima.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── The Lamentable Tragedy of Titus Andronicus.
          ├── Actus Primus. Scœna Prima.
          ├── Actus Secunda.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── The Tragedie of Romeo and Ivliet.
          └── Actus Primus. Scœna Prima.
        ├── The Life of Tymon of Athens.
          ├── Actus Primus. Scœna Prima.
          └── The Actors Names.
        ├── The Tragedie of Ivlivs Cæsar.
          ├── Actus Primus. Scœna Prima.
          ├── Actus Secundus.
          ├── Actus Tertius.
          ├── Actus Quartus.
          └── Actus Quintus.
        ├── The Tragedie of Macbeth.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── [Act 1] Scena Quinta.
          ├── [Act 1] Scena Sexta.
          ├── [Act 1] Scena Septima.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scena Tertia.
          ├── [Act 3] Scæna Quarta.
          ├── [Act 3] Scena Quinta.
          ├── [Act 3] Scæna Sexta.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scæna Tertia.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scena Secunda.
          ├── [Act 5] Scæna Tertia.
          ├── [Act 5] Scena Quarta.
          ├── [Act 5] Scena Quinta.
          ├── [Act 5] Scena Sexta.
          └── [Act 5] Scena Septima.
        ├── The Tragedie of Hamlet, Prince of Denmarke.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── Actus Secundus.
          └── [Act 2] Scena Secunda.
        ├── The Tragedie of King Lear.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── [Act 1] Scena Quinta.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scæna Tertia.
          ├── [Act 3] Scena Quarta.
          ├── [Act 3] Scena Quinta.
          ├── [Act 3] Scena Sexta.
          ├── [Act 3] Scena Septima.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── [Act 4] Scena Quinta.
          ├── [Act 4] Scæna Septima.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scena Secunda.
          └── [Act 5] Scena Tertia.
        ├── The Tragedie of Othello, the Moore of Venice.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scæna Tertia.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scœna Secunda.
          ├── [Act 3] Scœna Tertia.
          ├── [Act 3] Scæna Quarta.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scæna Secunda.
          └── The Names of the Actors.
        ├── The Tragedie of Anthonie, and Cleopatra.
          └── Actus Primus. Scœna Prima.
        ├── The Tragedie of Cymbeline.
          ├── Actus Primus. Scœna Prima.
          ├── [Act 1] Scena Secunda.
          ├── [Act 1] Scena Tertia.
          ├── [Act 1] Scena Quarta.
          ├── [Act 1] Scena Quinta.
          ├── [Act 1] Scena Sexta.
          ├── [Act 1] Scena Septima.
          ├── Actus Secundus. Scena Prima.
          ├── [Act 2] Scena Secunda.
          ├── [Act 2] Scena Tertia.
          ├── [Act 2] Scena Quarta.
          ├── Actus Tertius. Scena Prima.
          ├── [Act 3] Scena Secunda.
          ├── [Act 3] Scena Tertia.
          ├── [Act 3] Scena Quarta.
          ├── [Act 3] Scena Quinta.
          ├── [Act 3] Scena Sexta.
          ├── [Act 3] Scena Septima.
          ├── [Act 3] Scena Octaua.
          ├── Actus Quartus. Scena Prima.
          ├── [Act 4] Scena Secunda.
          ├── [Act 4] Scena Tertia.
          ├── [Act 4] Scena Quarta.
          ├── Actus Quintus. Scena Prima.
          ├── [Act 5] Scena Secunda.
          ├── [Act 5] Scena Tertia.
          ├── [Act 5] Scena Quarta.
          └── [Act 5] Scena Quinta.
      ├── [Colophon]
      "
    `);
  });
});
