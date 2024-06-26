import {
  SearchService as _SearchService,
  SearchServiceAutocomplete,
  IdOrAtId,
  SearchServiceAutocompleteQueryParams,
  SearchServiceAutocompleteResponse,
  SearchServiceSearchResponse,
  SearchServiceQueryParams,
  Manifest,
  SearchServiceCommonHitSelectors,
} from '@iiif/presentation-3';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { g } from 'vitest/dist/suite-a18diDsI.js';
import { createStore } from 'zustand/vanilla';

export type Search1Service = _SearchService & {
  service?: SearchServiceAutocomplete | SearchServiceAutocomplete[] | undefined;
};

const getId = (idOrAtId: IdOrAtId<any>): string => (idOrAtId as any).id || (idOrAtId as any)['@id'];

export interface Search1AutocompleteStore {
  hasAutocomplete: boolean;
  endpoint: string | undefined;
  results: SearchServiceAutocompleteResponse['terms'];
  lastQuery: SearchServiceAutocompleteQueryParams | null;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  ignored: string[];
  setSearchService: (service: Search1Service) => void;
  clearSearch: () => void;
  search: (
    query: string,
    options?: { motivation?: string; date?: string; user?: string; headers?: HeadersInit }
  ) => void | Promise<void>;
}

export function findSearch1Service(manifest: ManifestNormalized | Manifest): Search1Service | null {
  if (!manifest || !manifest.service) {
    return null;
  }
  return manifest
    ? (manifest.service.find(
        (service: any) =>
          (service as any).profile === 'SearchService1' ||
          (service as any).profile === 'http://iiif.io/api/search/1/search'
      ) as any)
    : null;
}

export function findAutocompleteService(service: Search1Service): SearchServiceAutocomplete | undefined {
  if (!service || !service.service) return;
  const services = Array.isArray(service.service) ? service.service : [service.service];
  return services.find(
    (s: any) =>
      s.profile === 'http://iiif.io/api/search/0/autocomplete' ||
      s.profile === 'http://iiif.io/api/search/1/autocomplete' ||
      s.profile === 'AutoCompleteService1'
  );
}

export const createSearch1AutocompleteStore = (
  service?: Search1Service | undefined,
  options?: { fetcher?: Fetcher<SearchServiceAutocompleteResponse> }
) => {
  const fetcher: Fetcher<SearchServiceAutocompleteResponse> = options?.fetcher || defaultFetcher;
  const autocomplete = service ? findAutocompleteService(service) : undefined;
  const autocompleteEndpoint = autocomplete ? getId(autocomplete) : undefined;

  let abort: AbortController | null = null;

  return createStore<Search1AutocompleteStore>((set, get) => ({
    results: [],
    lastQuery: {} as SearchServiceAutocompleteQueryParams,
    hasAutocomplete: !!autocomplete,
    endpoint: autocompleteEndpoint,
    loading: false,
    error: false,
    errorMessage: '',
    ignored: [],

    setSearchService(newService: Search1Service) {
      const autocomplete = findAutocompleteService(newService);
      if (autocomplete) {
        set({
          endpoint: getId(autocomplete),
          hasAutocomplete: true,
          results: [],
          loading: false,
          lastQuery: null,
          error: false,
          errorMessage: '',
        });
      }
    },

    clearSearch() {
      set({ results: [], loading: false, lastQuery: null });
    },

    async search(
      query: string,
      options: { motivation?: string; date?: string; user?: string; headers?: HeadersInit } = {}
    ) {
      const endpoint = get().endpoint;
      if (get().hasAutocomplete === false) {
        return;
      }
      if (abort && !abort.signal.aborted) {
        abort.abort();
      }

      abort = new AbortController();

      const params = new URLSearchParams();
      params.set('q', query);
      if (options.motivation) {
        params.set('motivation', options.motivation);
      }
      if (options.date) {
        params.set('date', options.date);
      }
      if (options.user) {
        params.set('user', options.user);
      }

      let shouldLoad = true;

      if ((!query || query.length < 3) && !options.motivation && !options.date && !options.user) {
        shouldLoad = false;
      }

      set({
        loading: shouldLoad,
        lastQuery: {
          q: query,
          motivation: options.motivation,
          date: options.date,
          user: options.user,
        },
      });

      if (!shouldLoad) {
        return;
      }

      return fetcher(`${endpoint}?${params.toString()}`, {
        signal: abort.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      }).then(async ([json, error]) => {
        if (abort?.signal.aborted) {
          return;
        }
        if (json) {
          set({
            loading: false,
            ignored: json.ignored || [],
            results: json.terms,
            error: false,
            errorMessage: '',
          });
        } else {
          set({ results: [], error: true, errorMessage: error || undefined });
        }
      });
    },
  }));
};

export type SingleSearchHit = {
  '@type': 'search:Hit';
  annotations: string[];
  selectors: Array<SearchServiceCommonHitSelectors>;
  match?: string;
  before?: string;
  after?: string;
};

export interface Search1Store {
  endpoint: string | undefined;
  service: Search1Service | undefined;
  lastQuery: SearchServiceQueryParams;
  resources: SearchServiceSearchResponse['resources'];
  hits: SingleSearchHit[];
  loading: boolean;
  error: boolean;
  hasAutocomplete: boolean;
  hasSearch: boolean;
  errorMessage: string;
  hitIndex: number;
  highlight: {
    results: SearchServiceSearchResponse['resources'] | null;
    hit: SingleSearchHit | null;
  };
  search: (query: SearchServiceQueryParams, options?: { headers?: HeadersInit }) => void | Promise<void>;
  setSearchService: (service: Search1Service) => void;
  clearSearch: () => void;
  highlightHit: (index: number) => void;
  nextHit: () => void;
  previousHit: () => void;
}

type FetcherReturn<T> = Promise<[T | null, error: string | null]>;
type Fetcher<T> = (query: string, options: { signal: AbortSignal; headers?: HeadersInit }) => FetcherReturn<T>;

function defaultFetcher(
  query: string,
  { signal, headers }: { signal: AbortSignal; headers?: HeadersInit }
): FetcherReturn<any> {
  return fetch(query, {
    signal: signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers || {}),
    },
  }).then(async (response) => {
    if (response.ok) {
      return [await response.json(), null] as const;
    }
    return [null, response.statusText] as const;
  });
}

export const createSearch1Store = (
  service?: Search1Service | string,
  options?: {
    fetcher?: Fetcher<SearchServiceSearchResponse>;
  }
) => {
  const fetcher = options?.fetcher || defaultFetcher;

  let searchService: Search1Service | undefined;
  if (typeof service === 'string') {
    searchService = {
      '@context': 'http://iiif.io/api/search/1/context.json',
      profile: 'http://iiif.io/api/search/1/search',
      '@id': service,
      id: service,
      service: [],
    };
  } else {
    searchService = service;
  }

  let abort: AbortController | null = null;

  return createStore<Search1Store>((set, get) => ({
    endpoint: searchService ? getId(searchService) : undefined,
    service: searchService,
    resources: [],
    hits: [],
    lastQuery: {} as SearchServiceQueryParams,
    loading: false,
    error: false,
    highlight: {
      results: null,
      hit: null,
    },
    hitIndex: -1,
    hasSearch: !!searchService,
    hasAutocomplete: searchService ? !!findAutocompleteService(searchService) : false,
    errorMessage: '',
    async search(query: SearchServiceQueryParams, options: { headers?: HeadersInit } = {}) {
      const endpoint = get().endpoint;
      if (!endpoint) {
        throw new Error('No search service found.');
      }
      if (abort && !abort.signal.aborted) {
        abort.abort();
      }

      abort = new AbortController();

      const params = new URLSearchParams();
      if (query.q) {
        params.set('q', query.q);
      }
      if (query.motivation) {
        params.set('motivation', query.motivation);
      }
      if (query.date) {
        params.set('date', query.date);
      }
      if (query.user) {
        params.set('user', query.user);
      }

      set({
        lastQuery: query,
        loading: true,
      });

      const response = await fetcher(`${endpoint}?${params.toString()}`, {
        signal: abort.signal,
        headers: options.headers,
      }).then(([json, errorMessage]) => {
        if (abort?.signal.aborted) {
          return;
        }
        if (json) {
          set({
            resources: (json.resources || []).map((result: any) => {
              if (result.search && !result.url) {
                result.url = result.search;
              }
              return result;
            }),
            hits:
              json.hits ||
              (json.resources || []).map((result: any) => {
                return {
                  '@type': 'search:Hit',
                  after: '',
                  annotations: [result['@id']],
                  before: '',
                  match: result.resource.chars,
                };
              }),
            error: false,
            errorMessage: '',
            loading: false,
          });
        } else {
          set({
            loading: false,
            resources: [],
            error: true,
            errorMessage: errorMessage || undefined,
          });
        }
      });

      return response;
    },

    setSearchService(newService: Search1Service) {
      set({
        service: newService,
        endpoint: newService ? getId(newService) : undefined,
        hasSearch: !!newService,
        hasAutocomplete: newService ? !!findAutocompleteService(newService) : false,
        loading: false,
        resources: [],
        error: false,
        errorMessage: '',
        highlight: { results: null, hit: null },
      });
    },

    // Other actions?
    clearSearch() {
      set({ resources: [], error: false, errorMessage: '' });
    },

    highlightHit(index: number) {
      const state = get();
      const hit = state.hits[index];
      if (!hit) {
        return;
      }
      const results = state.resources.filter((r) => hit.annotations.includes(r['@id']));
      set({ hitIndex: index, highlight: { results, hit } });
    },
    nextHit() {
      const state = get();
      const nextIndex = state.hitIndex + 1;
      if (nextIndex >= state.hits.length) {
        return;
      }
      state.highlightHit(nextIndex);
    },
    previousHit() {
      const state = get();
      const nextIndex = state.hitIndex - 1;
      if (nextIndex < 0) {
        return;
      }
      state.highlightHit(nextIndex);
    },
  }));
};
