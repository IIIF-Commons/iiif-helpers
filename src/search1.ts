import {
  SearchService as _SearchService,
  SearchServiceAutocomplete,
  IdOrAtId,
  SearchServiceAutocompleteQueryParams,
  SearchServiceAutocompleteResponse,
  SearchServiceSearchResponse,
  SearchServiceQueryParams,
} from '@iiif/presentation-3';
import { createStore } from 'zustand/vanilla';

export type Search1Service = _SearchService & {
  service: SearchServiceAutocomplete | SearchServiceAutocomplete[];
};

const getId = (idOrAtId: IdOrAtId<any>): string => (idOrAtId as any).id || (idOrAtId as any)['@id'];

export interface Search1AutocompleteStore {
  results: SearchServiceAutocompleteResponse['terms'];
  lastQuery: SearchServiceAutocompleteQueryParams | null;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  ignored: string[];
  search: (
    query: string,
    options?: { motivation?: string; date?: string; user?: string; headers?: HeadersInit }
  ) => void | Promise<void>;
}

export function findAutocompleteService(service: Search1Service): SearchServiceAutocomplete | undefined {
  const services = Array.isArray(service.service) ? service.service : [service.service];
  return services.find(
    (s: any) =>
      s.profile === 'http://iiif.io/api/search/0/autocomplete' ||
      s.profile === 'http://iiif.io/api/search/1/autocomplete' ||
      s.profile === 'AutoCompleteService1'
  );
}

export const createSearch1AutocompleteStore = (
  service: Search1Service,
  options?: { fetcher?: Fetcher<SearchServiceAutocompleteResponse> }
) => {
  const fetcher: Fetcher<SearchServiceAutocompleteResponse> = options?.fetcher || defaultFetcher;
  const autocomplete = findAutocompleteService(service);
  if (!autocomplete) {
    // Does not have one.
    return null;
  }

  const endpoint = getId(autocomplete);

  let abort: AbortController | null = null;

  return createStore<Search1AutocompleteStore>((set, get) => ({
    results: [],

    lastQuery: {} as SearchServiceAutocompleteQueryParams,
    loading: false,
    error: false,
    errorMessage: '',
    ignored: [],

    async search(
      query: string,
      options: { motivation?: string; date?: string; user?: string; headers?: HeadersInit } = {}
    ) {
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

      if ((!query || query.length < 3) && !options.motivation && !options.date && !options.user) {
        set({ results: [], loading: false, lastQuery: null });
        return;
      }

      set({
        loading: true,
        lastQuery: {
          q: query,
          motivation: options.motivation,
          date: options.date,
          user: options.user,
        },
      });

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

    //
  }));
};

export interface Search1Store {
  endpoint: string | undefined;
  service: Search1Service | undefined;
  lastQuery: SearchServiceQueryParams;
  resources: SearchServiceSearchResponse['resources'];
  loading: boolean;
  error: boolean;
  hasAutocomplete: boolean;
  hasSearch: boolean;
  errorMessage: string;
  highlight: SearchServiceSearchResponse['resources'][number] | null;
  search: (query: SearchServiceQueryParams, options?: { headers?: HeadersInit }) => void | Promise<void>;
  clearSearch: () => void;
  highlightResult: (id: string) => void;
  nextResult: () => void;
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
    lastQuery: {} as SearchServiceQueryParams,
    loading: false,
    error: false,
    highlight: null,
    hasSearch: !!searchService,
    hasAutocomplete: searchService ? !!findAutocompleteService(searchService) : false,
    errorMessage: '',
    search(query: SearchServiceQueryParams, options: { headers?: HeadersInit } = {}) {
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

      set({ loading: true });

      return fetcher(`${endpoint}?${params.toString()}`, {
        signal: abort.signal,
        headers: options.headers,
      }).then(([json, errorMessage]) => {
        if (abort?.signal.aborted) {
          return;
        }
        if (json) {
          set({
            resources: json.resources,
            error: false,
            errorMessage: '',
          });
        } else {
          set({ resources: [], error: true, errorMessage: errorMessage || undefined });
        }
      });
    },

    setSearchService(newService: Search1Service) {
      set({
        service: newService,
        endpoint: newService ? getId(newService) : undefined,
        hasSearch: !!searchService,
        hasAutocomplete: searchService ? !!findAutocompleteService(searchService) : false,
        loading: false,
        resources: [],
        error: false,
        errorMessage: '',
        highlight: null,
      });
    },

    // Other actions?
    clearSearch() {
      set({ resources: [], error: false, errorMessage: '' });
    },
    highlightResult(id: string) {
      const highlight = get().resources.find((r) => r['@id'] === id);
      set({ highlight });
    },
    nextResult() {
      const results = get().resources;
      const highlight = get().highlight;
      if (!highlight) {
        set({ highlight: results[0] || null });
        return;
      }

      const index = results.findIndex((r) => r['@id'] === highlight['@id']);
      if (index === -1) {
        set({ highlight: results[0] || null });
        return;
      }

      set({ highlight: results[index + 1] || results[0] || null });
    },
    previousResult() {
      const results = get().resources;
      const highlight = get().highlight;
      if (!highlight) {
        set({ highlight: results[results.length - 1] || null });
        return;
      }

      const index = results.findIndex((r) => r['@id'] === highlight['@id']);
      if (index === -1) {
        set({ highlight: results[results.length - 1] || null });
        return;
      }

      if (index === 0) {
        set({ highlight: results[results.length - 1] || null });
        return;
      }

      set({ highlight: results[index - 1] || results[results.length - 1] || null });
    },
  }));
};
