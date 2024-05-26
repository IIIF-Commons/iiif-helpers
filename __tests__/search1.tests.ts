import { describe, expect, test } from 'vitest';
import wunderAutoComplete from '../fixtures/search1/autocomplete.json';
import { createSearch1AutocompleteStore } from '../src/search1';
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
          return [wunderAutoComplete, null];
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
});
