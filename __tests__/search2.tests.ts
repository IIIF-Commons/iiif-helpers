import { describe, expect, test } from 'vitest';
import {
  createSearch2AutocompleteStore,
  createSearch2Store,
  findSearch2AutocompleteService,
  findSearch2Service,
  type Search2Service,
} from '../src/search2';

const service: Search2Service = {
  id: 'https://example.org/services/identifier/search',
  type: 'SearchService2',
  service: [
    {
      id: 'https://example.org/services/identifier/autocomplete',
      type: 'AutoCompleteService2',
    },
  ],
};

describe('Search 2 helper', () => {
  test('finds Search 2 and autocomplete services', () => {
    const manifest = {
      id: 'https://example.org/manifest',
      type: 'Manifest',
      service: [{ id: 'https://example.org/other', type: 'OtherService' }, service],
    };

    expect(findSearch2Service(manifest as any)).toBe(service);
    expect(findSearch2AutocompleteService(service)).toEqual({
      id: 'https://example.org/services/identifier/autocomplete',
      type: 'AutoCompleteService2',
    });
  });

  test('Search 2 autocomplete TermPage example', async () => {
    let requestedUrl = '';
    let requestedHeaders: HeadersInit | undefined;
    const autocomplete = createSearch2AutocompleteStore(service, {
      fetcher: async (url, options) => {
        requestedUrl = url;
        requestedHeaders = options.headers;
        return [
          {
            '@context': 'http://iiif.io/api/search/2/context.json',
            id: 'https://example.org/services/identifier/autocomplete?q=bir',
            type: 'TermPage',
            ignored: ['user'],
            items: [
              { value: 'bird', language: 'en', total: 15 },
              { type: 'Term', value: 'birth', label: { en: ['birth'] } },
            ],
          },
          null,
        ];
      },
    });

    await autocomplete.getState().search('bir', {
      motivation: 'painting',
      user: 'https://example.org/users/1',
      min: 2,
      headers: { Authorization: 'Bearer token' },
    });

    expect(requestedUrl).toBe(
      'https://example.org/services/identifier/autocomplete?q=bir&motivation=painting&user=https%3A%2F%2Fexample.org%2Fusers%2F1&min=2'
    );
    expect(requestedHeaders).toMatchObject({ Authorization: 'Bearer token' });
    expect(autocomplete.getState().loading).toBe(false);
    expect(autocomplete.getState().error).toBe(false);
    expect(autocomplete.getState().ignored).toEqual(['user']);
    expect(autocomplete.getState().results).toEqual([
      { value: 'bird', language: 'en', total: 15 },
      { type: 'Term', value: 'birth', label: { en: ['birth'] } },
    ]);
  });

  test('Search 2 autocomplete does nothing without an autocomplete service', async () => {
    let requests = 0;
    const autocomplete = createSearch2AutocompleteStore(
      { id: 'https://example.org/search', type: 'SearchService2' },
      {
        fetcher: async () => {
          requests += 1;
          return [null, 'Should not fetch'];
        },
      }
    );

    await autocomplete.getState().search('bird');

    expect(requests).toBe(0);
    expect(autocomplete.getState().hasAutocomplete).toBe(false);
  });

  test('Search 2 simple AnnotationPage response creates fallback hits', async () => {
    let requestedUrl = '';
    let requestedHeaders: HeadersInit | undefined;
    const search = createSearch2Store('https://example.org/services/identifier/search', {
      fetcher: async (url, options) => {
        requestedUrl = url;
        requestedHeaders = options.headers;
        return [
          {
            '@context': 'http://iiif.io/api/search/2/context.json',
            id: 'https://example.org/services/identifier/search?q=bird&motivation=painting',
            type: 'AnnotationPage',
            ignored: ['date'],
            items: [
              {
                id: 'https://example.org/identifier/annotation/anno-line',
                type: 'Annotation',
                motivation: 'painting',
                body: {
                  type: 'TextualBody',
                  value: 'A bird in the hand is worth two in the bush',
                  format: 'text/plain',
                },
                target: 'https://example.org/identifier/canvas1#xywh=100,100,250,20',
              },
            ],
          },
          null,
        ];
      },
    });

    expect(search.getState().hasSearch).toBe(true);

    await search
      .getState()
      .search(
        { q: 'bird', motivation: 'painting', date: '2020-01-01T00:00:00Z/2021-01-01T00:00:00Z' },
        { headers: { Authorization: 'Bearer token' } }
      );

    expect(requestedUrl).toBe(
      'https://example.org/services/identifier/search?q=bird&motivation=painting&date=2020-01-01T00%3A00%3A00Z%2F2021-01-01T00%3A00%3A00Z'
    );
    expect(requestedHeaders).toEqual({ Authorization: 'Bearer token' });
    expect(search.getState().ignored).toEqual(['date']);
    expect(search.getState().resources).toHaveLength(1);
    expect(search.getState().hits).toEqual([
      {
        '@type': 'search:Hit',
        annotations: ['https://example.org/identifier/annotation/anno-line'],
        selectors: [],
        before: '',
        match: 'A bird in the hand is worth two in the bush',
        after: '',
      },
    ]);

    search.getState().highlightHit(0);

    expect(search.getState().highlight.results).toEqual(search.getState().resources);
  });

  test('Search 2 extended AnnotationPage response creates hits from match annotations', async () => {
    const search = createSearch2Store(service, {
      fetcher: async () => [
        {
          '@context': 'http://iiif.io/api/search/2/context.json',
          id: 'https://example.org/service/manifest/search?q=bird',
          type: 'AnnotationPage',
          items: [
            {
              id: 'https://example.org/identifier/annotation/anno-bird',
              type: 'Annotation',
              motivation: 'painting',
              body: {
                type: 'TextualBody',
                value: 'birds',
                format: 'text/plain',
              },
              target: 'https://example.org/identifier/canvas1#xywh=200,100,40,20',
            },
          ],
          annotations: [
            {
              type: 'AnnotationPage',
              items: [
                {
                  id: 'https://example.org/identifier/annotation/match-1',
                  type: 'Annotation',
                  motivation: 'contextualizing',
                  target: {
                    type: 'SpecificResource',
                    source: 'https://example.org/identifier/annotation/anno-bird',
                    selector: [
                      {
                        type: 'TextQuoteSelector',
                        prefix: 'There are two ',
                        exact: 'birds',
                        suffix: ' in the bush',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        null,
      ],
    });

    await search.getState().search({ q: 'bird' });

    expect(search.getState().hits).toEqual([
      {
        '@type': 'search:Hit',
        annotations: ['https://example.org/identifier/annotation/anno-bird'],
        selectors: [
          {
            type: 'TextQuoteSelector',
            prefix: 'There are two ',
            exact: 'birds',
            suffix: ' in the bush',
          },
        ],
        before: 'There are two ',
        match: 'birds',
        after: ' in the bush',
      },
    ]);

    search.getState().highlightHit(0);

    expect(search.getState().highlight.hit?.match).toBe('birds');
    expect(search.getState().highlight.results?.[0]?.id).toBe('https://example.org/identifier/annotation/anno-bird');
  });

  test('Search 2 no-service search throws', async () => {
    const search = createSearch2Store();

    await expect(search.getState().search({ q: 'bird' })).rejects.toThrow('No search service found.');
  });
});
