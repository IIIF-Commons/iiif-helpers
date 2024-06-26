import { Collection } from '@iiif/presentation-3';
import { createDateNavigation } from '../src/nav-date';
import { Vault } from '../src';

function renderTreeAsAscii(navDates: any[]) {
  const lines: string[] = [];
  for (const century of navDates) {
    lines.push(`${century.label.en[0]}`);
    if (!century.items) {
      lines.push(`  ${century.label.en[0]}`);
      continue;
    }
    for (const decade of century.items) {
      if (!decade.items) {
        lines.push(`  ${decade.label.en[0]}`);
        continue;
      }
      lines.push(`  ${decade.label.en[0]}`);
      for (const year of decade.items) {
        if (!year.items) {
          lines.push(`    ${year.label.en[0]}`);
          continue;
        }
        lines.push(`    ${year.label.en[0]}`);
        for (const month of year.items) {
          if (!month.items) {
            lines.push(`      ${month.label.en[0]}`);
            continue;
          }
          lines.push(`      ${month.label.en[0]}`);
          for (const day of month.items) {
            if (!day.items) {
              lines.push(`        ${day.label.en[0]}`);
              continue;
            }
            lines.push(`        ${day.label.en[0]}`);
            for (const item of day.items) {
              if (!item.label) continue;
              lines.push(`          ${item.label.en[0]} (${item.navDate})`);
            }
          }
        }
      }
    }
  }
  return lines.join('\n');
}

describe('nav-date helper', () => {
  describe('createDateNavigation', () => {
    test('should create a navigation tree', () => {
      const collection: Collection = {
        '@context': 'http://iiif.io/api/presentation/3/context.json',
        id: 'https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json',
        type: 'Collection',
        label: {
          en: ['Chesapeake and Ohio Canal map and guide pamphlets'],
        },
        thumbnail: [
          {
            id: 'https://iiif.io/api/image/3.0/example/reference/43153e2ec7531f14dd1c9b2fc401678a-88695674/full/max/0/default.jpg',
            type: 'Image',
            format: 'image/jpeg',
            height: 300,
            width: 221,
            service: [
              {
                id: 'https://iiif.io/api/image/3.0/example/reference/43153e2ec7531f14dd1c9b2fc401678a-88695674',
                profile: 'level1',
                type: 'ImageService3',
              },
            ],
          },
        ],
        items: [
          {
            id: 'https://iiif.io/api/cookbook/recipe/0230-navdate/navdate_map_2-manifest.json',
            type: 'Manifest',
            label: {
              en: ['1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide'],
            },
            navDate: '1986-01-01T00:00:00+00:00',
          },
          {
            id: 'https://iiif.io/api/cookbook/recipe/0230-navdate/navdate_map_1-manifest.json',
            type: 'Manifest',
            label: {
              en: ['1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide'],
            },
            navDate: '1987-01-01T00:00:00+00:00',
          },
        ],
      } as any;
      const vault = new Vault();
      const col = vault.loadSync(collection.id, collection);

      const auto = createDateNavigation(vault, col as any);
      expect(renderTreeAsAscii(auto)).toMatchInlineSnapshot(`
        "1986
          January
            Wed Jan 01 1986
              1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide
        1987
          January
            Thu Jan 01 1987
              1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide"
      `);

      const byCentury = createDateNavigation(vault, col as any, 'century');
      expect(renderTreeAsAscii(byCentury)).toMatchInlineSnapshot(`
        "1900 - 1999
          1980 - 1989
            1986
              January
                Wed Jan 01 1986
                  1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide (1986-01-01T00:00:00+00:00)
            1987
              January
                Thu Jan 01 1987
                  1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide (1987-01-01T00:00:00+00:00)"
      `);

      const byDecade = createDateNavigation(vault, col as any, 'decade');
      expect(renderTreeAsAscii(byDecade)).toMatchInlineSnapshot(`
        "1980 - 1989
          1986
            January
              Wed Jan 01 1986
                1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide
          1987
            January
              Thu Jan 01 1987
                1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide"
      `);

      const byYear = createDateNavigation(vault, col as any, 'year');
      expect(renderTreeAsAscii(byYear)).toMatchInlineSnapshot(`
        "1986
          January
            Wed Jan 01 1986
              1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide
        1987
          January
            Thu Jan 01 1987
              1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide"
      `);

      const byMonth = createDateNavigation(vault, col as any, 'month');
      expect(renderTreeAsAscii(byMonth)).toMatchInlineSnapshot(`
        "January 1986
          Wed Jan 01 1986
            1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide
        January 1987
          Thu Jan 01 1987
            1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide"
      `);

      const byDay = createDateNavigation(vault, col as any, 'day');
      expect(renderTreeAsAscii(byDay)).toMatchInlineSnapshot(`
        "Wed Jan 01 1986
          1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide
        Thu Jan 01 1987
          1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide"
      `);

      // Final of the full count
      expect(byCentury).toMatchInlineSnapshot(`
        [
          {
            "count": 2,
            "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/century/1900",
            "items": [
              {
                "count": 2,
                "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/decade/1980",
                "items": [
                  {
                    "count": 1,
                    "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/year/1986",
                    "items": [
                      {
                        "count": 1,
                        "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/month/1986/1",
                        "items": [
                          {
                            "count": 1,
                            "day": 1,
                            "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/day/1986/1/1",
                            "items": [
                              {
                                "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate_map_2-manifest.json",
                                "label": {
                                  "en": [
                                    "1986 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide",
                                  ],
                                },
                                "navDate": "1986-01-01T00:00:00+00:00",
                                "type": "Manifest",
                              },
                            ],
                            "label": {
                              "en": [
                                "Wed Jan 01 1986",
                              ],
                            },
                            "type": "day",
                          },
                        ],
                        "label": {
                          "en": [
                            "January",
                          ],
                        },
                        "month": 0,
                        "type": "month",
                      },
                    ],
                    "label": {
                      "en": [
                        "1986",
                      ],
                    },
                    "type": "year",
                    "year": 1986,
                  },
                  {
                    "count": 1,
                    "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/year/1987",
                    "items": [
                      {
                        "count": 1,
                        "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/month/1987/1",
                        "items": [
                          {
                            "count": 1,
                            "day": 1,
                            "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate-collection.json/day/1987/1/1",
                            "items": [
                              {
                                "id": "https://iiif.io/api/cookbook/recipe/0230-navdate/navdate_map_1-manifest.json",
                                "label": {
                                  "en": [
                                    "1987 Chesapeake and Ohio Canal, Washington, D.C., Maryland, West Virginia, official map and guide",
                                  ],
                                },
                                "navDate": "1987-01-01T00:00:00+00:00",
                                "type": "Manifest",
                              },
                            ],
                            "label": {
                              "en": [
                                "Thu Jan 01 1987",
                              ],
                            },
                            "type": "day",
                          },
                        ],
                        "label": {
                          "en": [
                            "January",
                          ],
                        },
                        "month": 0,
                        "type": "month",
                      },
                    ],
                    "label": {
                      "en": [
                        "1987",
                      ],
                    },
                    "type": "year",
                    "year": 1987,
                  },
                ],
                "label": {
                  "en": [
                    "1980 - 1989",
                  ],
                },
                "type": "decade",
                "yearEnd": 1989,
                "yearStart": 1980,
              },
            ],
            "label": {
              "en": [
                "1900 - 1999",
              ],
            },
            "type": "century",
            "yearEnd": 1999,
            "yearStart": 1900,
          },
        ]
      `);
    });
  });
});
