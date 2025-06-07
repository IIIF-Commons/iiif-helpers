import { describe, test, expect } from 'vitest';
import { Vault } from '../src/vault';

describe('Paged collections', () => {

  test.only('Single page of collections', async () => {
    const collection = {
      "@context": "https://iiif.io/api/presentation/3/context.json",
      id: 'https://example.org/collection',
      type: 'Collection',
      label: { en: ['Example Collection'] },
      first: {id: 'https://example.org/collection?page=1', type: 'Collection'},
      total: 3,
    };

    const collectionPage1 = {
      "@context": "https://iiif.io/api/presentation/3/context.json",
      id: 'https://example.org/collection?page=1',
      type: 'Collection',
      label: { en: ['Example Collection Page 1'] },
      next: {id: 'https://example.org/collection?page=2', type: 'Collection'},
      items: [
        {
          "@context": "https://iiif.io/api/presentation/3/context.json",
          id: 'https://example.org/collection/item1',
          type: 'Manifest',
          label: { en: ['Example Manifest 1'] },
          thumbnail: 'https://example.org/collection/item1/thumbnail',
        },
        {
          "@context": "https://iiif.io/api/presentation/3/context.json",
          id: 'https://example.org/collection/item2',
          type: 'Manifest',
          label: { en: ['Example Manifest 2'] },
          thumbnail: 'https://example.org/collection/item2/thumbnail',
        }
      ],
    };

    const collectionPage2 = {
      "@context": "https://iiif.io/api/presentation/3/context.json",
      id: 'https://example.org/collection?page=2',
      type: 'Collection',
      label: { en: ['Example Collection Page 2'] },
      prev: { id: 'https://example.org/collection?page=1', type: 'Collection' },
      items: [
        {
          "@context": "https://iiif.io/api/presentation/3/context.json",
          id: 'https://example.org/collection/item3',
          type: 'Manifest',
          label: { en: ['Example Manifest 3'] },
          thumbnail: 'https://example.org/collection/item3/thumbnail',
        }
      ],
    };

    const vault = new Vault();

    // 1. Load collection
    vault.loadCollectionSync("https://example.org/collection", collection);

    const fullCollection = vault.get("https://example.org/collection");
    expect(fullCollection.first).toEqual({ id: 'https://example.org/collection?page=1', type: "Collection" });

    // 2. We check if its a paginated collection
    //
    const pagination = vault.getPaginationState({ id: "https://example.org/collection", type: "Collection" });

    expect(pagination).toMatchInlineSnapshot(`
      {
        "currentPage": null,
        "currentPageIndex": null,
        "isFetching": false,
        "isFullyLoaded": false,
        "next": {
          "id": "https://example.org/collection?page=1",
          "type": "Collection",
        },
        "page": 1,
        "pages": [],
        "previous": null,
        "totalItems": 3,
      }
    `);
    const hasNextPage = pagination?.isFullyLoaded === false;

    expect(hasNextPage).toBe(true);
    //
    // 3. Load the next page.
    //
    const [state1, page1] = await vault.loadNextPage({ id: "https://example.org/collection", type: "Collection" }, collectionPage1);
    //       ^ single page returned

    expect(state1).toMatchInlineSnapshot(`
      {
        "currentLength": 2,
        "currentPage": "https://example.org/collection?page=1",
        "currentPageIndex": 0,
        "error": null,
        "isFetching": false,
        "isFullyLoaded": false,
        "next": "https://example.org/collection?page=2",
        "page": 1,
        "pages": [
          {
            "id": "https://example.org/collection?page=1",
            "order": 0,
            "pageLength": 2,
            "startIndex": 0,
            "type": "Collection",
          },
        ],
        "previous": null,
        "totalItems": 3,
      }
    `);

    expect(page1).toMatchInlineSnapshot(`
      {
        "@context": "https://iiif.io/api/presentation/3/context.json",
        "accompanyingCanvas": null,
        "annotations": [],
        "behavior": [],
        "homepage": [],
        "id": "https://example.org/collection?page=1",
        "iiif-parser:hasPart": [
          {
            "id": "https://example.org/collection?page=1",
            "iiif-parser:partOf": "https://example.org/collection?page=1",
            "type": "Collection",
          },
        ],
        "items": [
          {
            "@context": "https://iiif.io/api/presentation/3/context.json",
            "id": "https://example.org/collection/item1",
            "iiif-parser:isExternal": true,
            "label": {
              "en": [
                "Example Manifest 1",
              ],
            },
            "thumbnail": [
              {
                "id": "https://example.org/collection/item1/thumbnail",
                "type": "ContentResource",
              },
            ],
            "type": "Manifest",
          },
          {
            "@context": "https://iiif.io/api/presentation/3/context.json",
            "id": "https://example.org/collection/item2",
            "iiif-parser:isExternal": true,
            "label": {
              "en": [
                "Example Manifest 2",
              ],
            },
            "thumbnail": [
              {
                "id": "https://example.org/collection/item2/thumbnail",
                "type": "ContentResource",
              },
            ],
            "type": "Manifest",
          },
        ],
        "label": {
          "en": [
            "Example Collection Page 1",
          ],
        },
        "metadata": [],
        "navDate": null,
        "next": {
          "id": "https://example.org/collection?page=2",
          "type": "Collection",
        },
        "partOf": [],
        "placeholderCanvas": null,
        "provider": [],
        "rendering": [],
        "requiredStatement": null,
        "rights": null,
        "seeAlso": [],
        "service": [],
        "services": [],
        "summary": null,
        "thumbnail": [],
        "type": "Collection",
        "viewingDirection": "left-to-right",
      }
    `);

    const fullCollectionWithPage1 = vault.get({ id: "https://example.org/collection", type: "Collection" });
    //       ^ collection pages are appended to the original collection

    expect(fullCollectionWithPage1.items).toHaveLength(2);

    // 4. Load next page.
    const [state2, page2] = await vault.loadNextPage({ id: "https://example.org/collection", type: "Collection" }, collectionPage2);

    expect(state2).toMatchInlineSnapshot(`
      {
        "currentLength": 3,
        "currentPage": "https://example.org/collection?page=2",
        "currentPageIndex": 1,
        "error": null,
        "isFetching": false,
        "isFullyLoaded": true,
        "next": null,
        "page": 2,
        "pages": [
          {
            "id": "https://example.org/collection?page=1",
            "order": 0,
            "pageLength": 2,
            "startIndex": 0,
            "type": "Collection",
          },
          {
            "id": "https://example.org/collection?page=2",
            "order": 1,
            "pageLength": 1,
            "startIndex": 2,
            "type": "Collection",
          },
        ],
        "previous": "https://example.org/collection?page=1",
        "totalItems": 3,
      }
    `);

    // 5. Check the full collection length again.
    const fullCollectionWithPage2 = vault.get({ id: "https://example.org/collection", type: "Collection" });
    expect(fullCollectionWithPage2.items).toHaveLength(3);

    // 4. Get all loaded pages.
    //
    const paginationFinal = vault.getPaginationState({ id: "https://example.org/collection", type: "Collection" })!;
    const allPages = vault.get(paginationFinal.pages);
    //       ^ Array of collections.

    expect(allPages).toMatchInlineSnapshot(`
      [
        {
          "@context": "https://iiif.io/api/presentation/3/context.json",
          "accompanyingCanvas": null,
          "annotations": [],
          "behavior": [],
          "homepage": [],
          "id": "https://example.org/collection?page=1",
          "iiif-parser:hasPart": [
            {
              "id": "https://example.org/collection?page=1",
              "iiif-parser:partOf": "https://example.org/collection?page=1",
              "type": "Collection",
            },
          ],
          "items": [
            {
              "@context": "https://iiif.io/api/presentation/3/context.json",
              "id": "https://example.org/collection/item1",
              "iiif-parser:isExternal": true,
              "label": {
                "en": [
                  "Example Manifest 1",
                ],
              },
              "thumbnail": [
                {
                  "id": "https://example.org/collection/item1/thumbnail",
                  "type": "ContentResource",
                },
              ],
              "type": "Manifest",
            },
            {
              "@context": "https://iiif.io/api/presentation/3/context.json",
              "id": "https://example.org/collection/item2",
              "iiif-parser:isExternal": true,
              "label": {
                "en": [
                  "Example Manifest 2",
                ],
              },
              "thumbnail": [
                {
                  "id": "https://example.org/collection/item2/thumbnail",
                  "type": "ContentResource",
                },
              ],
              "type": "Manifest",
            },
          ],
          "label": {
            "en": [
              "Example Collection Page 1",
            ],
          },
          "metadata": [],
          "navDate": null,
          "next": {
            "id": "https://example.org/collection?page=2",
            "type": "Collection",
          },
          "partOf": [],
          "placeholderCanvas": null,
          "provider": [],
          "rendering": [],
          "requiredStatement": null,
          "rights": null,
          "seeAlso": [],
          "service": [],
          "services": [],
          "summary": null,
          "thumbnail": [],
          "type": "Collection",
          "viewingDirection": "left-to-right",
        },
        {
          "@context": "https://iiif.io/api/presentation/3/context.json",
          "accompanyingCanvas": null,
          "annotations": [],
          "behavior": [],
          "homepage": [],
          "id": "https://example.org/collection?page=2",
          "iiif-parser:hasPart": [
            {
              "id": "https://example.org/collection?page=2",
              "iiif-parser:partOf": "https://example.org/collection?page=2",
              "type": "Collection",
            },
          ],
          "items": [
            {
              "@context": "https://iiif.io/api/presentation/3/context.json",
              "id": "https://example.org/collection/item3",
              "iiif-parser:isExternal": true,
              "label": {
                "en": [
                  "Example Manifest 3",
                ],
              },
              "thumbnail": [
                {
                  "id": "https://example.org/collection/item3/thumbnail",
                  "type": "ContentResource",
                },
              ],
              "type": "Manifest",
            },
          ],
          "label": {
            "en": [
              "Example Collection Page 2",
            ],
          },
          "metadata": [],
          "navDate": null,
          "partOf": [],
          "placeholderCanvas": null,
          "prev": {
            "id": "https://example.org/collection?page=1",
            "type": "Collection",
          },
          "provider": [],
          "rendering": [],
          "requiredStatement": null,
          "rights": null,
          "seeAlso": [],
          "service": [],
          "services": [],
          "summary": null,
          "thumbnail": [],
          "type": "Collection",
          "viewingDirection": "left-to-right",
        },
      ]
    `);
  });


});
