import tableOfContentManifests from '../fixtures/cookbook/toc.json';
import {
  Vault,
  getValue,
  rangeToTableOfContentsTree,
  rangesToTableOfContentsTree,
  RangeTableOfContentsNode,
} from '../src';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import tableOfContentsAvManifest from '../fixtures/cookbook/toc-av.json';
import wellcomeRange from '../fixtures/presentation-2/wellcome-range.json';
import blManifest from '../fixtures/presentation-3/bl-av-manifest.json';
import invariant from 'tiny-invariant';

// Test utility.
// Render range in ascii with children + indentation.
const treeChars = {
  vertical: '│',
  horizontal: '─',
  corner: '└',
  tee: '├',
  space: ' ',
};

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
      const manifest = vault.loadSync<ManifestNormalized>(tableOfContentManifests.id, tableOfContentManifests);

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
  });
});
