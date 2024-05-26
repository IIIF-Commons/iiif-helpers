import { describe, expect, test } from 'vitest';
import wunderAutoComplete from '../fixtures/search1/autocomplete.json';
import searchResponse from '../fixtures/search1/search.json';
import { createSearch1AutocompleteStore, createSearch1Store } from '../src/search1';
import invariant from 'tiny-invariant';

describe('Search 1 helper', () => {
  test('Search 1 autocomplete example', async () => {
    const helper = createSearch1AutocompleteStore(
      {
        '@id': 'https://iiif.wellcomecollection.org/search/v1/b18035723',
        '@type': 'SearchService1',
        profile: 'http://iiif.io/api/search/1/search',
        label: 'Search within this manifest',
        service: {
          '@id': 'https://iiif.wellcomecollection.org/search/autocomplete/v1/b18035723',
          '@type': 'AutoCompleteService1',
          profile: 'http://iiif.io/api/search/1/autocomplete',
          label: 'Autocomplete words in this manifest',
        },
      } as any,
      {
        fetcher: async (url: string, options: RequestInit) => {
          return [wunderAutoComplete as any, null];
        },
      }
    );

    invariant(helper, 'Helper should be defined');

    const $action = helper.getState();

    await $action.search('wunder');

    expect(helper.getState().errorMessage).toBe('');
    expect(helper.getState().error).toBe(false);
    expect(helper.getState().loading).toBe(false);
    expect(helper.getState().ignored).toMatchInlineSnapshot(`[]`);
    expect(helper.getState().lastQuery).toMatchInlineSnapshot(`
      {
        "date": undefined,
        "motivation": undefined,
        "q": "wunder",
        "user": undefined,
      }
    `);
    expect(helper.getState().results).toMatchInlineSnapshot(`
      [
        {
          "match": "wunder",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunder",
        },
        {
          "match": "wunderbar",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunderbar",
        },
        {
          "match": "wunderbare",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunderbare",
        },
        {
          "match": "wundervoll",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wundervoll",
        },
        {
          "match": "wunderbarer",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunderbarer",
        },
        {
          "match": "wunderblume",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunderblume",
        },
        {
          "match": "wunderblumen",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wunderblumen",
        },
        {
          "match": "wundervolles",
          "search": "https://iiif.wellcomecollection.org/search/v1/b18035723?q=wundervolles",
        },
      ]
    `);
  });

  test('Search 1 example', async () => {
    const search = createSearch1Store(
      {
        '@context': 'http://iiif.io/api/search/1/context.json',
        '@id': 'https://api.digitale-sammlungen.de/iiif/services/search/v1/bsb10267231',
        profile: 'http://iiif.io/api/search/1/search',
      },
      {
        fetcher: async (url: string, options: RequestInit) => {
          return [searchResponse as any, null];
        },
      }
    );

    const $actions = search.getState();

    expect($actions.hasSearch).toBe(true);

    await $actions.search({ q: 'test' });

    expect(search.getState().errorMessage).toBe('');
    expect(search.getState().error).toBe(false);
    expect(search.getState().loading).toBe(false);
    expect(search.getState().lastQuery).toMatchInlineSnapshot(`
      {
        "q": "test",
      }
    `);

    expect(search.getState().resources).not.toHaveLength(0);
    expect(search.getState().hits).not.toHaveLength(0);

    // Highlight.
    $actions.highlightHit(0);
    expect(search.getState().highlight).toMatchInlineSnapshot(`
      {
        "hit": {
          "@type": "search:Hit",
          "after": " in nachfolgender Weise zugetragen hat.",
          "annotations": [
            "https://api.digitale-sammlungen.de/iiif/services/search/v1/bsb10267231/anno/fd5845c8c1a96fd0",
          ],
          "before": "Erstens beschreibt sie was sich im Jahre ",
          "match": "1615",
        },
        "results": [
          {
            "@id": "https://api.digitale-sammlungen.de/iiif/services/search/v1/bsb10267231/anno/fd5845c8c1a96fd0",
            "@type": "oa:Annotation",
            "motivation": "sc:painting",
            "on": "https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb10267231/canvas/10#xywh=921,516,82,44",
            "resource": {
              "@type": "cnt:ContentAsText",
              "chars": "1615",
            },
          },
        ],
      }
    `);

    $actions.nextHit();
    expect(search.getState().highlight).toMatchInlineSnapshot(`
      {
        "hit": {
          "@type": "search:Hit",
          "after": " zur Nachtszeit sowohl von Schmerzen als Durst geplagt wurde, kamen meine heiligen Engel zu mir und sprachen: Liebe Schwester! komme hieher; der Herr ruft dich.",
          "annotations": [
            "https://api.digitale-sammlungen.de/iiif/services/search/v1/bsb10267231/anno/1bb78ba8497ff704",
          ],
          "before": "Als ich im Juni ",
          "match": "1615",
        },
        "results": [
          {
            "@id": "https://api.digitale-sammlungen.de/iiif/services/search/v1/bsb10267231/anno/1bb78ba8497ff704",
            "@type": "oa:Annotation",
            "motivation": "sc:painting",
            "on": "https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb10267231/canvas/37#xywh=526,1509,83,43",
            "resource": {
              "@type": "cnt:ContentAsText",
              "chars": "1615",
            },
          },
        ],
      }
    `);
  });
});
