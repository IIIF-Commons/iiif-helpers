# Search 1 Helper

The Search 1 helper wraps a IIIF Search API 1 service in small Zustand vanilla stores.

It exports:

- `findSearch1Service(manifest)`
- `findAutocompleteService(searchService)`
- `createSearch1Store(serviceOrEndpoint, options?)`
- `createSearch1AutocompleteStore(searchService, options?)`

You can import from the dedicated entrypoint:

```ts
import {
  createSearch1AutocompleteStore,
  createSearch1Store,
  findAutocompleteService,
  findSearch1Service,
} from '@iiif/helpers/search1';
```

## Finding the Search Service

If you already have a manifest, use `findSearch1Service()` to pull the Search API 1 service from its `service` array.

```ts
import { findSearch1Service } from '@iiif/helpers/search1';

const searchService = findSearch1Service(manifest);

if (!searchService) {
  console.log('This manifest does not expose a Search API 1 service');
}
```

The helper looks for either of these profiles:

- `SearchService1`
- `http://iiif.io/api/search/1/search`

If you already have the search endpoint URL, you can skip discovery and pass the string directly to `createSearch1Store()`.

## Search Store

`createSearch1Store()` creates a vanilla Zustand store for executing searches and stepping through hits.

```ts
import { createSearch1Store, findSearch1Service } from '@iiif/helpers/search1';

const service = findSearch1Service(manifest);
const search = createSearch1Store(service || undefined);

await search.getState().search({ q: '1615' });

console.log(search.getState().resources);
console.log(search.getState().hits);
```

If you only have an endpoint:

```ts
import { createSearch1Store } from '@iiif/helpers/search1';

const search = createSearch1Store('https://example.org/iiif/search');

await search.getState().search({ q: 'birds' });
```

### Search query

The search helper accepts the Search API 1 query params supported by the implementation:

- `q`
- `motivation`
- `date`
- `user`

```ts
await search.getState().search(
  {
    q: 'wunder',
    motivation: 'painting',
  },
  {
    headers: {
      Authorization: 'Bearer token',
    },
  }
);
```

### Search store state

The store exposes:

- `endpoint`: resolved search endpoint
- `service`: current search service object
- `lastQuery`: last submitted query object
- `resources`: `json.resources` from the search response
- `hits`: `json.hits`, or generated hits when the response does not include them
- `loading`: `true` while a request is in flight
- `error`: `true` when the last request failed
- `errorMessage`: last fetch error message
- `hasSearch`: `true` when a search service is configured
- `hasAutocomplete`: `true` when the search service includes an autocomplete service
- `hitIndex`: currently highlighted hit index
- `highlight`: the currently highlighted hit and its matching resources

### Search store actions

- `search(query, options?)`: execute a search request
- `setSearchService(service)`: replace the active search service and reset store state
- `clearSearch()`: clears `resources`, `error`, and `errorMessage`
- `highlightHit(index)`: set the active hit and matching resources
- `nextHit()`: move to the next hit
- `previousHit()`: move to the previous hit

### Highlighting results

Use `highlightHit()` after a search to select a specific hit and pull out the matching annotation resources.

```ts
await search.getState().search({ q: '1615' });

search.getState().highlightHit(0);

console.log(search.getState().highlight.hit);
console.log(search.getState().highlight.results);

search.getState().nextHit();
search.getState().previousHit();
```

## Autocomplete Store

`createSearch1AutocompleteStore()` creates a second store for the nested autocomplete service.

```ts
import { createSearch1AutocompleteStore, findSearch1Service } from '@iiif/helpers/search1';

const service = findSearch1Service(manifest);
const autocomplete = createSearch1AutocompleteStore(service || undefined);

await autocomplete.getState().search('wunder');

console.log(autocomplete.getState().results);
```

To inspect the autocomplete service without creating a store:

```ts
import { findAutocompleteService } from '@iiif/helpers/search1';

const autocompleteService = service ? findAutocompleteService(service) : undefined;
```

The helper looks for either of these profiles:

- `AutoCompleteService1`
- `http://iiif.io/api/search/1/autocomplete`
- `http://iiif.io/api/search/0/autocomplete`

### Autocomplete query

The autocomplete helper accepts:

- `query`: the text input, sent as `q`
- `motivation`
- `date`
- `user`
- `headers`

```ts
await autocomplete.getState().search('wunder', {
  user: 'https://example.org/users/1',
  headers: {
    Authorization: 'Bearer token',
  },
});
```

### Autocomplete store state

The store exposes:

- `hasAutocomplete`
- `endpoint`
- `results`
- `lastQuery`
- `loading`
- `error`
- `errorMessage`
- `ignored`

### Autocomplete store actions

- `search(query, options?)`
- `setSearchService(service)`
- `clearSearch()`

## Implementation Notes

- Both helpers abort the previous in-flight request before starting a new one.
- `createSearch1Store()` throws `No search service found.` if you call `search()` without an endpoint.
- `createSearch1AutocompleteStore()` does nothing when there is no autocomplete service.
- Autocomplete does not fetch for short queries under 3 characters unless at least one of `motivation`, `date`, or `user` is provided.
- Search results with a `search` property but no `url` property are normalized so `url` is set to the same value.
- If the Search API response does not include `hits`, the helper generates them from `resources` using each annotation id and `resource.chars`.

## Minimal Example

```ts
import {
  createSearch1AutocompleteStore,
  createSearch1Store,
  findSearch1Service,
} from '@iiif/helpers/search1';

const service = findSearch1Service(manifest);

if (!service) {
  throw new Error('Search service not found');
}

const search = createSearch1Store(service);
const autocomplete = createSearch1AutocompleteStore(service);

await autocomplete.getState().search('wun');
console.log(autocomplete.getState().results);

await search.getState().search({ q: 'wunder' });
search.getState().highlightHit(0);

console.log(search.getState().highlight);
```
