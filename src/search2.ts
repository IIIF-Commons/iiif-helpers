import type { Manifest } from '@iiif/presentation-3';
import type { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { createStore } from 'zustand/vanilla';

export type Search2Service = {
  id: string;
  type: 'SearchService2' | string;
  service?: Search2AutocompleteService | Search2AutocompleteService[];
  [key: string]: any;
};

export type Search2AutocompleteService = {
  id: string;
  type: 'AutoCompleteService2' | string;
  [key: string]: any;
};

export type Search2QueryParams = {
  q?: string;
  motivation?: string;
  date?: string;
  user?: string;
};

export type Search2AutocompleteQueryParams = Search2QueryParams & {
  min?: number;
};

export type Search2Term = {
  type?: 'Term' | string;
  value: string;
  total?: number;
  label?: Record<string, string[]>;
  language?: string;
  service?: Search2Service[];
  [key: string]: any;
};

export type Search2TermPage = {
  '@context'?: string;
  id: string;
  type: 'TermPage' | string;
  ignored?: string[];
  items: Search2Term[];
};

export type Search2Annotation = {
  id?: string;
  '@id'?: string;
  type?: string;
  motivation?: string;
  body?: any;
  target?: any;
  [key: string]: any;
};

export type Search2AnnotationPage = {
  '@context'?: string;
  id?: string;
  type: 'AnnotationPage' | string;
  ignored?: string[];
  items?: Search2Annotation[];
  annotations?: Search2AnnotationPage[];
  [key: string]: any;
};

export type Search2Selector = {
  type?: string;
  prefix?: string;
  exact?: string;
  suffix?: string;
  [key: string]: any;
};

export type Search2Hit = {
  '@type': 'search:Hit';
  annotations: string[];
  selectors: Search2Selector[];
  match?: string;
  before?: string;
  after?: string;
};

export interface Search2AutocompleteStore {
  hasAutocomplete: boolean;
  endpoint: string | undefined;
  results: Search2Term[];
  lastQuery: Search2AutocompleteQueryParams | null;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  ignored: string[];
  setSearchService: (service: Search2Service) => void;
  clearSearch: () => void;
  search: (
    query: string,
    options?: { motivation?: string; date?: string; user?: string; min?: number; headers?: HeadersInit }
  ) => void | Promise<void>;
}

export interface Search2Store {
  endpoint: string | undefined;
  service: Search2Service | undefined;
  lastQuery: Search2QueryParams;
  resources: Search2Annotation[];
  hits: Search2Hit[];
  loading: boolean;
  error: boolean;
  hasAutocomplete: boolean;
  hasSearch: boolean;
  errorMessage: string;
  ignored: string[];
  hitIndex: number;
  highlight: {
    results: Search2Annotation[] | null;
    hit: Search2Hit | null;
  };
  search: (query: Search2QueryParams, options?: { headers?: HeadersInit }) => void | Promise<void>;
  setSearchService: (service: Search2Service) => void;
  clearSearch: () => void;
  highlightHit: (index: number) => void;
  nextHit: () => void;
  previousHit: () => void;
}

type FetcherReturn<T> = Promise<[T | null, error: string | null] | readonly [T | null, error: string | null]>;
type Fetcher<T> = (query: string, options: { signal: AbortSignal; headers?: HeadersInit }) => FetcherReturn<T>;

const getId = (resource: { id?: string; '@id'?: string }): string => resource.id || resource['@id'] || '';
const asArray = <T>(value: T | T[] | undefined): T[] => (Array.isArray(value) ? value : value ? [value] : []);

export function findSearch2Service(manifest: ManifestNormalized | Manifest): Search2Service | null {
  const services = asArray((manifest as any)?.service);
  return (services.find((service: any) => service?.type === 'SearchService2') as Search2Service) || null;
}

export function findSearch2AutocompleteService(service: Search2Service): Search2AutocompleteService | undefined {
  return asArray(service?.service).find((nested: any) => nested?.type === 'AutoCompleteService2');
}

function defaultFetcher(
  query: string,
  { signal, headers }: { signal: AbortSignal; headers?: HeadersInit }
): FetcherReturn<any> {
  return fetch(query, {
    signal,
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

function appendSearchParams(params: URLSearchParams, query: Search2QueryParams) {
  if (query.q) params.set('q', query.q);
  if (query.motivation) params.set('motivation', query.motivation);
  if (query.date) params.set('date', query.date);
  if (query.user) params.set('user', query.user);
}

function getBodyValue(body: any): string {
  const bodies = asArray(body);
  const textualBody = bodies.find((item) => item?.value);
  return textualBody?.value || '';
}

function getSelectors(target: any): Search2Selector[] {
  return asArray(target?.selector);
}

function createHitsFromMatchAnnotations(page: Search2AnnotationPage): Search2Hit[] {
  return asArray(page.annotations)
    .flatMap((annotationPage) => annotationPage.items || [])
    .map((annotation) => {
      const targets = asArray(annotation.target);
      const annotations = targets.map((target) => target?.source).filter(Boolean);
      const selectors = targets.flatMap(getSelectors);
      const textQuote = selectors.find((selector) => selector.type === 'TextQuoteSelector') || selectors[0] || {};

      return {
        '@type': 'search:Hit',
        annotations,
        selectors,
        before: textQuote.prefix || '',
        match: textQuote.exact || '',
        after: textQuote.suffix || '',
      } as Search2Hit;
    })
    .filter((hit) => hit.annotations.length > 0);
}

function createFallbackHits(resources: Search2Annotation[]): Search2Hit[] {
  return resources.map((resource) => ({
    '@type': 'search:Hit',
    annotations: [getId(resource)].filter(Boolean),
    selectors: [],
    before: '',
    match: getBodyValue(resource.body),
    after: '',
  }));
}

export const createSearch2AutocompleteStore = (
  service?: Search2Service | undefined,
  options?: { fetcher?: Fetcher<Search2TermPage> }
) => {
  const fetcher = options?.fetcher || defaultFetcher;
  const autocomplete = service ? findSearch2AutocompleteService(service) : undefined;
  const autocompleteEndpoint = autocomplete ? getId(autocomplete) : undefined;

  let abort: AbortController | null = null;

  return createStore<Search2AutocompleteStore>((set, get) => ({
    results: [],
    lastQuery: {} as Search2AutocompleteQueryParams,
    hasAutocomplete: !!autocomplete,
    endpoint: autocompleteEndpoint,
    loading: false,
    error: false,
    errorMessage: '',
    ignored: [],

    setSearchService(newService: Search2Service) {
      const autocomplete = findSearch2AutocompleteService(newService);
      if (autocomplete) {
        set({
          endpoint: getId(autocomplete),
          hasAutocomplete: true,
          results: [],
          loading: false,
          lastQuery: null,
          error: false,
          errorMessage: '',
          ignored: [],
        });
      }
    },

    clearSearch() {
      set({ results: [], loading: false, lastQuery: null });
    },

    async search(
      query: string,
      options: { motivation?: string; date?: string; user?: string; min?: number; headers?: HeadersInit } = {}
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
      appendSearchParams(params, {
        q: query,
        motivation: options.motivation,
        date: options.date,
        user: options.user,
      });
      if (typeof options.min === 'number') {
        params.set('min', String(options.min));
      }

      const shouldLoad = !!query && (query.length >= 3 || !!options.motivation || !!options.date || !!options.user);

      set({
        loading: shouldLoad,
        lastQuery: {
          q: query,
          motivation: options.motivation,
          date: options.date,
          user: options.user,
          min: options.min,
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
      }).then(([json, error]) => {
        if (abort?.signal.aborted) {
          return;
        }
        if (json) {
          set({
            loading: false,
            ignored: json.ignored || [],
            results: json.items || [],
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

export const createSearch2Store = (
  service?: Search2Service | string,
  options?: {
    fetcher?: Fetcher<Search2AnnotationPage>;
  }
) => {
  const fetcher = options?.fetcher || defaultFetcher;

  const searchService =
    typeof service === 'string'
      ? {
          '@context': 'http://iiif.io/api/search/2/context.json',
          id: service,
          type: 'SearchService2',
          service: [],
        }
      : service;

  let abort: AbortController | null = null;

  return createStore<Search2Store>((set, get) => ({
    endpoint: searchService ? getId(searchService) : undefined,
    service: searchService,
    resources: [],
    hits: [],
    lastQuery: {} as Search2QueryParams,
    loading: false,
    error: false,
    highlight: {
      results: null,
      hit: null,
    },
    hitIndex: -1,
    hasSearch: !!searchService,
    hasAutocomplete: searchService ? !!findSearch2AutocompleteService(searchService) : false,
    errorMessage: '',
    ignored: [],

    async search(query: Search2QueryParams, options: { headers?: HeadersInit } = {}) {
      const endpoint = get().endpoint;
      if (!endpoint) {
        throw new Error('No search service found.');
      }
      if (abort && !abort.signal.aborted) {
        abort.abort();
      }

      abort = new AbortController();

      const params = new URLSearchParams();
      appendSearchParams(params, query);

      set({
        lastQuery: query,
        loading: true,
      });

      return fetcher(`${endpoint}?${params.toString()}`, {
        signal: abort.signal,
        headers: options.headers,
      }).then(([json, errorMessage]) => {
        if (abort?.signal.aborted) {
          return;
        }
        if (json) {
          const resources = json.items || [];
          const hits = createHitsFromMatchAnnotations(json);

          set({
            resources,
            hits: hits.length ? hits : createFallbackHits(resources),
            ignored: json.ignored || [],
            error: false,
            errorMessage: '',
            loading: false,
          });
        } else {
          set({
            loading: false,
            resources: [],
            hits: [],
            error: true,
            errorMessage: errorMessage || undefined,
          });
        }
      });
    },

    setSearchService(newService: Search2Service) {
      set({
        service: newService,
        endpoint: newService ? getId(newService) : undefined,
        hasSearch: !!newService,
        hasAutocomplete: newService ? !!findSearch2AutocompleteService(newService) : false,
        loading: false,
        resources: [],
        hits: [],
        error: false,
        errorMessage: '',
        ignored: [],
        highlight: { results: null, hit: null },
      });
    },

    clearSearch() {
      set({ resources: [], hits: [], error: false, errorMessage: '' });
    },

    highlightHit(index: number) {
      const state = get();
      const hit = state.hits[index];
      if (!hit) {
        return;
      }
      const results = state.resources.filter((resource) => hit.annotations.includes(getId(resource)));
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
