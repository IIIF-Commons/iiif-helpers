# `@iiif/helpers`

`@iiif/helpers` is a TypeScript utility library for building IIIF applications.

It combines:

- pure helpers for annotation targets, content state, language maps, and image services
- higher-level helpers for thumbnails, painting annotations, ranges, search, `navDate`, and transcriptions
- a normalized IIIF vault/store layer for loading, editing, serializing, and subscribing to IIIF resources

This repository publishes one npm package, `@iiif/helpers`, with a set of focused subpath entry points such as `@iiif/helpers/thumbnail` and `@iiif/helpers/vault/store`.

## What The Library Covers

- IIIF Presentation 2 and 3 loading, upgrading, and normalization
- normalized storage and mutation of IIIF entities through the Vault
- selector parsing for `xywh`, temporal fragments, Image API selectors, and SVG selectors
- IIIF Content State parsing, encoding, decoding, validation, and normalization
- language map selection and localization helpers
- thumbnail and image-service candidate selection
- painting annotation extraction, choice handling, and media discovery
- range traversal, table-of-contents generation, and sequence calculation
- Search API 1 search/autocomplete stores
- transcript discovery and extraction from plain text, VTT, and supplemental annotations
- vault-backed UI glue for events and styles

## Installation

`@iiif/parser` is a peer dependency and should be installed alongside the helpers package.

```bash
npm install @iiif/helpers @iiif/parser
```

```bash
pnpm add @iiif/helpers @iiif/parser
```

```bash
yarn add @iiif/helpers @iiif/parser
```

Notes:

- The package ships ESM, CJS, and TypeScript declarations for each public entry point.
- If you parse SVG selectors in Node, provide a `DOMParser` implementation such as `jsdom` or `happy-dom`.
- If you use remote loading in Node, a modern runtime with built-in `fetch` is the simplest setup.

## Import Strategy

Use the root package when you want the common surface area:

```ts
import { Vault, createThumbnailHelper, getValue, expandTarget } from '@iiif/helpers';
```

Use subpath imports when you want a smaller, more explicit import surface or when you need packages that are not re-exported from the root:

```ts
import { getCanvasTranscription } from '@iiif/helpers/transcriptions';
import { createStore } from '@iiif/helpers/vault/store';
import { entityActions } from '@iiif/helpers/vault/actions';
import { Vault as NodeVault } from '@iiif/helpers/vault-node';
```

The root entry point re-exports the main helper packages, but it does **not** re-export:

- `@iiif/helpers/transcriptions`
- `@iiif/helpers/vault-node`
- `@iiif/helpers/vault/actions`
- `@iiif/helpers/vault/store`
- `@iiif/helpers/vault/utility`
- `@iiif/helpers/vault/global-vault`

## Quick Start

```ts
import { Vault, getValue, createThumbnailHelper } from '@iiif/helpers';

const vault = new Vault();
const manifest = await vault.loadManifest('https://iiif.io/api/cookbook/recipe/0005-image-service/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const firstCanvas = vault.get(manifest.items[0]);
const label = getValue(manifest.label, { language: 'en-GB' });

const thumbnails = await createThumbnailHelper(vault).getBestThumbnailAtSize(firstCanvas, {
  width: 300,
  height: 300,
});

console.log(label);
console.log(thumbnails.best);
```

## Entry Points

The package is organized as subpath exports. The table below is the complete public entry-point map from `package.json`.

| Entry point                          | Re-exported from `@iiif/helpers` | Purpose                                                                                     |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `@iiif/helpers`                      | n/a                              | Convenience entry point for the main helpers.                                               |
| `@iiif/helpers/events`               | Yes                              | Vault-backed event registration for IIIF resources.                                         |
| `@iiif/helpers/i18n`                 | Yes                              | Language map and localization helpers.                                                      |
| `@iiif/helpers/styles`               | Yes                              | Vault-backed style metadata helpers.                                                        |
| `@iiif/helpers/thumbnail`            | Yes                              | Best-thumbnail resolution for collections, manifests, canvases, annotations, and resources. |
| `@iiif/helpers/annotation-targets`   | Yes                              | Selector and target parsing for IIIF and W3C annotations.                                   |
| `@iiif/helpers/content-state`        | Yes                              | Content State parsing, encoding, decoding, and normalization.                               |
| `@iiif/helpers/fetch`                | Yes                              | Fetch and upgrade Presentation manifests and collections.                                   |
| `@iiif/helpers/painting-annotations` | Yes                              | Painting annotation flattening and choice/media extraction.                                 |
| `@iiif/helpers/ranges`               | Yes                              | Range traversal, TOC generation, and range selection helpers.                               |
| `@iiif/helpers/sequences`            | Yes                              | Visible-canvas and page-order helpers for paged/continuous/individuals behavior.            |
| `@iiif/helpers/search1`              | Yes                              | Search API 1 search and autocomplete stores.                                                |
| `@iiif/helpers/image-service`        | Yes                              | Image-service loading, prediction, candidate extraction, and selection.                     |
| `@iiif/helpers/nav-date`             | Yes                              | Date-navigation trees from `navDate` values.                                                |
| `@iiif/helpers/vault`                | Yes                              | Core `Vault` class, types, and singleton helper.                                            |
| `@iiif/helpers/vault-node`           | No                               | Node-oriented `Vault` with fetch support.                                                   |
| `@iiif/helpers/vault/global-vault`   | No                               | Global singleton bridge for browser-global environments.                                    |
| `@iiif/helpers/vault/actions`        | No                               | Action constants and creators for vault state updates.                                      |
| `@iiif/helpers/vault/store`          | No                               | Zustand-based store factory and reducers used by the vault.                                 |
| `@iiif/helpers/vault/utility`        | No                               | Lower-level helpers for fetch pipelines and store access.                                   |
| `@iiif/helpers/transcriptions`       | No                               | Transcript detection and extraction helpers.                                                |

## Package Reference

### `@iiif/helpers`

The root entry point is a convenience export for the most commonly used helpers. It re-exports:

- `events`
- `styles`
- `thumbnail`
- `i18n`
- `content-state`
- `annotation-targets`
- `painting-annotations`
- `ranges`
- `sequences`
- `vault`
- `fetch`
- `search1`
- `nav-date`
- `image-service`

Use it when you want a single import surface for most browser-side work.

### `@iiif/helpers/annotation-targets`

This package normalizes IIIF and W3C annotation targets into a predictable `SpecificResource`-shaped structure.

Key exports:

- `expandTarget`
- `parseSelector`
- `parseRotation`
- `splitCanvasFragment`
- `isImageApiSelector`
- `isValidCanvasFragment`
- selector and target result types such as `SupportedTarget`, `BoxSelector`, `PointSelector`, `SvgSelector`, `TemporalSelector`, and `TemporalBoxSelector`

What it handles:

- plain canvas ids
- `#xywh=` fragments
- temporal fragments such as `#t=...`
- `SpecificResource` targets
- Image API selectors
- SVG selectors with normalized geometry and extracted style data
- targets with embedded selector fragments in `source.id`

Important notes:

- SVG selector parsing is best in the browser or with a provided `DOMParser`.
- The returned structure is designed to be easier to render than raw W3C selectors.
- `expandTarget()` always returns a `type: 'SpecificResource'` shape with `source`, `selector`, and `selectors`.

Example:

```ts
import { expandTarget } from '@iiif/helpers/annotation-targets';

const target = expandTarget('https://example.org/canvas-1#xywh=100,200,300,400');

console.log(target.selector?.type);
// BoxSelector
```

Selector-only example:

```ts
import { parseSelector } from '@iiif/helpers/annotation-targets';

const parsed = parseSelector({
  type: 'FragmentSelector',
  value: 'xywh=10,20,300,400&t=5,12.5',
});

console.log(parsed.selector);
// {
//   type: 'TemporalBoxSelector',
//   spatial: { x: 10, y: 20, width: 300, height: 400, unit: 'pixel' },
//   temporal: { startTime: 5, endTime: 12.5 }
// }
```

### `@iiif/helpers/content-state`

This package works with IIIF Content State values.

Key exports:

- `parseContentState`
- `serialiseContentState`
- `encodeContentState`
- `decodeContentState`
- `validateContentState`
- `normaliseContentState`
- related types such as `ContentState`, `StateSource`, and `NormalisedContentState`

What it does:

- parses already-decoded JSON strings
- parses base64url-encoded content state strings
- optionally fetches remote content state resources when called asynchronously
- encodes and decodes content state payloads
- normalizes different content state shapes into a consistent annotation form

Important notes:

- Validation is intentionally light-weight at the moment. It should be treated as a sanity check rather than full spec enforcement.
- Normalization uses the annotation-target helpers internally, so spatial selectors become structured selector objects instead of raw fragments.

Example:

```ts
import {
  parseContentState,
  serialiseContentState,
  validateContentState,
  normaliseContentState,
} from '@iiif/helpers/content-state';

const encoded = serialiseContentState({
  id: 'https://example.org/canvas-1#xywh=100,200,300,400',
  type: 'Canvas',
  partOf: [{ id: 'https://example.org/manifest-1', type: 'Manifest' }],
});

const parsed = parseContentState(encoded);
const [valid, error] = validateContentState(parsed, true);

if (!valid) {
  throw new Error(error?.reason ?? 'Invalid content state');
}

const normalized = normaliseContentState(parsed);
console.log(normalized.target[0].selector);
```

### `@iiif/helpers/events`

This is a small vault-backed event registry for IIIF resources.

Key exports:

- `createEventsHelper`

The helper gives you:

- `addEventListener(resource, event, listener, scope?)`
- `removeEventListener(resource, event, listener)`
- `getListenersAsProps(resourceOrId, scope?)`

It stores event handlers in vault meta so you can attach UI behavior to resources before they are rendered. This is especially useful in component-based UIs where passing callbacks down through many layers would otherwise be awkward.

Example:

```ts
import { Vault } from '@iiif/helpers';
import { createEventsHelper } from '@iiif/helpers/events';

const vault = new Vault();
const events = createEventsHelper(vault);
const annotation = { id: 'https://example.org/annotation/1', type: 'Annotation' };

events.addEventListener(annotation, 'onClick', (_event, resource) => {
  console.log('Clicked', resource.id);
});

const props = events.getListenersAsProps(annotation);

// React:
// <div {...props} />

// DOM:
// element.addEventListener('click', props.onClick);
```

### `@iiif/helpers/fetch`

This package exports a single helper:

- `fetch`

It fetches a Manifest or Collection and upgrades the response through `@iiif/parser/upgrader`, which makes it convenient when you want to support both Presentation 2 and Presentation 3 sources before loading them into a vault.

Example:

```ts
import { fetch as fetchIiif } from '@iiif/helpers/fetch';

const resource = await fetchIiif('https://example.org/manifest.json');
```

### `@iiif/helpers/i18n`

This package contains language-map helpers and a simple template-tag helper for localized strings.

Key exports:

- `getClosestLanguage`
- `buildLocaleString`
- `getValue`
- `getAvailableLanguagesFromResource`
- `createStringHelper`
- `iiifString`

Typical uses:

- select the best value from an IIIF language map
- apply explicit fallback languages
- detect languages used anywhere inside a collection, manifest, canvas, or range
- build localized labels inline with template literals

Example:

```ts
import { getValue, iiifString } from '@iiif/helpers/i18n';

const label = getValue({ fr: ['Titre'], en: ['Title'] }, { language: 'fr' });
const summary = iiifString`Label: ${{ en: ['An English label'] }}`;
```

Fallback example:

```ts
import { buildLocaleString } from '@iiif/helpers/i18n';

const label = buildLocaleString(
  { en: ['English title'], fr: ['Titre francais'], none: ['Untitled'] },
  'cy-GB',
  {
    fallbackLanguages: ['en-GB', 'en'],
    defaultText: 'Untitled manifest',
  }
);
```

### `@iiif/helpers/image-service`

This is the low-level image-service package used by the thumbnail helpers and useful on its own when you need to inspect or select image delivery options.

Key exports:

- `ImageServiceLoader`
- `createImageServiceStore`
- `imageServices`
- `getImageCandidates`
- `getImageCandidatesFromService`
- `getFixedSizeFromImage`
- `getFixedSizesFromService`
- `getCustomSizeFromService`
- `getImageFromTileSource`
- `getImageServerFromId`
- `getSmallestScaleFactorAsSingleImage`
- `pickBestFromCandidates`
- `imageSizesMatch`
- `inferImageSizeFromUrl`
- `sampledTilesToTiles`
- `isImage3`
- `isBestMatch`
- image candidate/result types

What it is good for:

- turning content resources and image services into a ranked set of image candidates
- picking the best candidate for a desired width/height or min/max constraints
- preloading or sampling image service responses
- predicting compatible services on known image servers to reduce repeated network work
- exposing service-loading state through a vanilla Zustand store

Important notes:

- `ImageServiceLoader` has both synchronous and asynchronous loading paths.
- The store returned by `createImageServiceStore()` includes both a Zustand `store` and an event emitter.
- The candidate model distinguishes fixed images, fixed-size services, variable services, and unknown-size images.

Example:

```ts
import {
  ImageServiceLoader,
  getImageCandidates,
  pickBestFromCandidates,
} from '@iiif/helpers/image-service';

const loader = new ImageServiceLoader();

const resource = {
  id: 'https://example.org/image/full/max/0/default.jpg',
  type: 'Image',
  width: 1200,
  height: 800,
  service: [
    {
      id: 'https://example.org/image',
      type: 'ImageService3',
      profile: 'level1',
    },
  ],
} as any;

const candidates = getImageCandidates(resource, false, loader);
const choice = pickBestFromCandidates({ width: 300, height: 200 }, [() => candidates]);

console.log(choice.best);
console.log(choice.fallback);
```

### `@iiif/helpers/nav-date`

This package builds navigation trees from `navDate`.

Key exports:

- `createDateNavigation`
- date-navigation types such as `DateNavigationCentury`, `DateNavigationDecade`, `DateNavigationYear`, `DateNavigationMonth`, and `DateNavigationDay`

How it behaves:

- it reads `navDate` values from items in a Collection or Manifest
- it groups them into century, decade, year, month, and day buckets
- if you do not pass an explicit level, it automatically collapses through single-item levels and returns the most useful level

Use it when you want archive-style time browsing or date facets built directly from IIIF metadata.

Example:

```ts
import { Vault } from '@iiif/helpers';
import { createDateNavigation } from '@iiif/helpers/nav-date';

const vault = new Vault();
const collection = vault.loadSync('https://example.org/collection', {
  id: 'https://example.org/collection',
  type: 'Collection',
  label: { en: ['Archive'] },
  items: [
    {
      id: 'https://example.org/manifest/1986',
      type: 'Manifest',
      label: { en: ['Issue 1986'] },
      navDate: '1986-01-01T00:00:00+00:00',
    },
    {
      id: 'https://example.org/manifest/1987',
      type: 'Manifest',
      label: { en: ['Issue 1987'] },
      navDate: '1987-01-01T00:00:00+00:00',
    },
  ],
});

const years = createDateNavigation(vault, collection!, 'year');

for (const year of years) {
  console.log(year.label.en?.[0], year.count);
}
```

### `@iiif/helpers/painting-annotations`

This package is for flattening painting annotations into a simpler renderable structure.

Key exports:

- `createPaintingAnnotationsHelper`
- `parseSpecificResource`
- `Paintables`
- choice-related types such as `SingleChoice`, `ComplexChoice`, and `ChoiceDescription`

The helper gives you:

- `getAllPaintingAnnotations(canvasOrId)`
- `getPaintables(canvasOrAnnotations, enabledChoices?)`
- `extractChoices(canvasOrAnnotations)`

What it does:

- resolves all painting annotations on a canvas
- unwraps `SpecificResource` bodies
- handles `Choice` bodies and records the available/selected choices
- returns a list of paintable resources with their original annotation, target, selector, and normalized type

This is useful when you are rendering mixed media, alternative image choices, or need a flat list of paintable bodies from a canvas.

Example:

```ts
import { Vault } from '@iiif/helpers';
import { createPaintingAnnotationsHelper } from '@iiif/helpers/painting-annotations';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const canvas = vault.get(manifest.items[0]);
const painting = createPaintingAnnotationsHelper(vault);
const paintables = painting.getPaintables(canvas);

console.log(paintables.types);
console.log(paintables.choice);

for (const item of paintables.items) {
  console.log(item.type, item.resource.id, item.selector);
}
```

### `@iiif/helpers/ranges`

This package covers traversal and interpretation of IIIF ranges.

Key exports:

- `createRangeHelper`
- `findFirstCanvasFromRange`
- `findFirstCanvasFromRangeWithSelector`
- `findAllCanvasesInRange`
- `findManifestSelectedRange`
- `findSelectedRange`
- `rangeToTableOfContentsTree`
- `rangesToTableOfContentsTree`
- `isRangeContiguous`
- `RangeTableOfContentsNode`

What it is good for:

- finding the first canvas represented by a range
- flattening all canvases found inside nested ranges
- determining which range contains a given canvas
- building a nested table-of-contents tree with canvas leaves and parent links
- checking whether a range is contiguous within a known canvas order, including gap and subset reporting

Important notes:

- `rangeToTableOfContentsTree()` creates a structured tree that is ready to render.
- `rangesToTableOfContentsTree()` creates a virtual root when you pass multiple top-level ranges.
- `isRangeContiguous()` can optionally return detailed diagnostics about invalid ranges, missing canvases, and gaps.

Example:

```ts
import { Vault } from '@iiif/helpers';
import {
  rangeToTableOfContentsTree,
  isRangeContiguous,
} from '@iiif/helpers/ranges';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest || !manifest.structures?.length) {
  throw new Error('Manifest has no ranges');
}

const range = vault.get(manifest.structures[0]);
const toc = rangeToTableOfContentsTree(vault, range);
const [isContiguous, detail] = isRangeContiguous(vault, range, manifest.items, { detail: true });

console.log(toc?.items?.map((item) => item.label));
console.log(isContiguous, detail?.gaps);
```

### `@iiif/helpers/search1`

This package contains helpers for IIIF Search API 1.

Key exports:

- `findSearch1Service`
- `findAutocompleteService`
- `createSearch1Store`
- `createSearch1AutocompleteStore`
- store types such as `Search1Store`, `Search1AutocompleteStore`, `Search1Service`, and `SingleSearchHit`

What it provides:

- a search store that queries a Search API 1 service, keeps `resources` and `hits`, and supports hit highlighting
- an autocomplete store that queries autocomplete endpoints and keeps a result list
- automatic aborting of in-flight requests when a new search replaces an old one

Example:

```ts
import {
  createSearch1Store,
  createSearch1AutocompleteStore,
} from '@iiif/helpers/search1';

const service = {
  '@id': 'https://example.org/search',
  profile: 'http://iiif.io/api/search/1/search',
  service: {
    '@id': 'https://example.org/search/autocomplete',
    profile: 'http://iiif.io/api/search/1/autocomplete',
  },
} as any;

const store = createSearch1Store(service);
await store.getState().search({ q: '1615' });
store.getState().highlightHit(0);

const autocomplete = createSearch1AutocompleteStore(service);
await autocomplete.getState().search('wunder');
```

### `@iiif/helpers/sequences`

This package calculates visible canvases and page order from IIIF behavior.

Key exports:

- `createSequenceHelper`
- `getVisibleCanvasesFromCanvasId`
- `getManifestSequence`

It understands manifest and range behaviors such as:

- `paged`
- `continuous`
- `individuals`
- canvas-level `facing-pages`
- canvas-level `non-paged`

Use it when you need to answer questions like:

- which canvases should be visible when canvas `X` is selected?
- what are the page groups for a paged interface?
- should this manifest render as single pages, spreads, or one continuous strip?

Example:

```ts
import { Vault } from '@iiif/helpers';
import {
  getManifestSequence,
  getVisibleCanvasesFromCanvasId,
} from '@iiif/helpers/sequences';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const [items, pageGroups] = getManifestSequence(vault, manifest);
const visible = getVisibleCanvasesFromCanvasId(vault, manifest, items[0].id);

console.log(pageGroups);
console.log(visible);
```

### `@iiif/helpers/styles`

This is a small vault-backed style metadata helper.

Key exports:

- `createStylesHelper`
- `StyleDefinition`
- `StyledHelper`

The helper gives you:

- `applyStyles(resource, scope, styles)`
- `getAppliedStyles(resource)`

It is useful when style information lives outside the IIIF resource but still needs to follow the same resource ids, for example annotation colors, highlight state, or editor-only presentation metadata.

Example:

```ts
import { Vault } from '@iiif/helpers';
import { createStylesHelper } from '@iiif/helpers/styles';

const vault = new Vault();
const styles = createStylesHelper(vault);
const annotation = { id: 'https://example.org/annotation/1', type: 'Annotation' };

vault.batch(() => {
  styles.applyStyles(annotation, 'selected', { background: 'red' });
  styles.applyStyles(annotation, 'hovered', { background: 'pink' });
});

console.log(styles.getAppliedStyles(annotation));
```

### `@iiif/helpers/thumbnail`

This package is the high-level thumbnail helper built on top of the image-service utilities.

Key exports:

- `getThumbnail`
- `createThumbnailHelper`
- `imageServiceLoader`
- thumbnail input/output types

What it accepts:

- string ids or URLs
- collection, manifest, canvas, annotation, annotation page, and content-resource references
- normalized IIIF resources

What it returns:

- `best`: the chosen thumbnail candidate
- `fallback`: other viable candidates
- `log`: explanation messages from the candidate-selection process

What it does:

- follows explicit `thumbnail` properties where present
- falls back to painted resources when needed
- dereferences and inspects image services when appropriate
- chooses the best available result for a requested size or constraint set

Example:

```ts
import { Vault } from '@iiif/helpers';
import { createThumbnailHelper, getThumbnail } from '@iiif/helpers/thumbnail';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const canvas = vault.get(manifest.items[0]);
const helper = createThumbnailHelper(vault);
const result = await helper.getBestThumbnailAtSize(canvas, { width: 256, height: 256 });

const quickResult = await getThumbnail(canvas, {
  vault,
  width: 512,
  height: 512,
  returnAllOptions: true,
});

console.log(result.best);
console.log(quickResult.fallback);
```

### `@iiif/helpers/transcriptions`

This package is focused on transcript detection and extraction.

Key exports:

- `canvasHasTranscriptionSync`
- `canvasLoadExternalAnnotationPages`
- `getCanvasTranscription`
- `manifestHasTranscriptions`
- `annotationPageToTranscription`
- `vttToTranscription`
- `timeStampToSeconds`

What it supports:

- plain text renderings on canvases
- `text/vtt` supplemental bodies on AV canvases
- `TextualBody` and `text/plain` supplemental annotations
- external annotation pages that need to be loaded before transcript detection

Returned transcription objects include:

- `plaintext`
- `segments`
- selector/timing information for segments when available

Important notes:

- VTT files are parsed into segment records with temporal selectors.
- External annotation pages can be loaded on demand with `canvasLoadExternalAnnotationPages()`.
- ALTO renderings are detected, but ALTO parsing is not implemented yet, so those paths currently return `null`.

Example:

```ts
import { Vault } from '@iiif/helpers';
import {
  manifestHasTranscriptions,
  getCanvasTranscription,
} from '@iiif/helpers/transcriptions';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const hasTranscriptions = await manifestHasTranscriptions(vault, manifest);

if (hasTranscriptions) {
  const canvas = vault.get(manifest.items[0]);
  const transcription = await getCanvasTranscription(vault, canvas);

  console.log(transcription?.plaintext);
  console.log(transcription?.segments[0]?.selector);
}
```

### `@iiif/helpers/vault`

This is the core stateful package in the library.

Key exports:

- `Vault`
- `globalVault`
- vault types such as `VaultOptions`, `Entities`, `IIIFStore`, `RequestState`, `MetaState`, and related action/type helpers

The `Vault` is a normalized IIIF resource store with loading, mutation, serialization, subscription, and helper methods.

Major capabilities:

- load manifests, collections, and other IIIF resources with `load()`, `loadManifest()`, and `loadCollection()`
- load synchronously from already-available JSON with `loadSync()`
- access normalized resources with `get()` and `hydrate()`
- navigate safely with `deep()`
- subscribe to store changes with `subscribe()`
- listen to dispatched actions with `on()`
- batch state changes with `batch()` and `asyncBatch()`
- serialize resources back to Presentation 2 or Presentation 3 with `toPresentation2()` and `toPresentation3()`
- manage per-resource meta state with `setMetaValue()` and `getResourceMeta()`
- paginate paged collections with `getPaginationState()` and `loadNextPage()`

The `Vault` also includes higher-level object wrappers:

- `getObject()`
- `loadObject()`
- `loadManifestObject()`
- `loadCollectionObject()`
- `wrapObject()` and `isWrapped()` methods on the class

Those wrapped objects resolve nested references through getters and expose helper methods like `refresh()`, `reactive()`, `unwrap()`, `toJSON()`, `toPresentation2()`, and `toPresentation3()`.

Example:

```ts
import { Vault } from '@iiif/helpers/vault';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

const firstCanvas = vault.get(manifest.items[0]);
vault.setMetaValue([firstCanvas.id, 'ui', 'selected'], true);

console.log(vault.getResourceMeta(firstCanvas.id, 'ui'));

const wrapped = vault.getObject(manifest);
console.log(wrapped.items[0].id);
console.log(wrapped.items[0].unwrap());
```

### `@iiif/helpers/vault-node`

This is the Node-oriented vault package.

Key exports:

- `Vault`
- `globalVault`
- the same core types re-exported by `@iiif/helpers/vault`

The `Vault` class in this package extends the core vault and configures a Node-friendly fetch path. Use it when you want vault behavior in server-side code and you do not want to wire a custom fetcher yourself.

Example:

```ts
import { Vault } from '@iiif/helpers/vault-node';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

console.log(manifest?.id);
```

### `@iiif/helpers/vault/actions`

This package exposes the vault's Redux-style action constants and action creators.

Examples include:

- `entityActions`
- `mappingActions`
- `metaActions`
- `requestActions`
- `addReference`
- `modifyEntityField`
- `moveEntity`
- `moveEntities`
- `updateReference`
- `changeReferenceIdentifier`
- request lifecycle constants such as `REQUEST_RESOURCE`, `RESOURCE_READY`, and `RESOURCE_ERROR`

Use it when you are integrating the vault store directly or building custom tooling on top of the same reducer model.

Example:

```ts
import { Vault } from '@iiif/helpers/vault';
import { entityActions } from '@iiif/helpers/vault/actions';

const vault = new Vault();
const manifest = await vault.loadManifest('https://example.org/manifest.json');

if (!manifest) {
  throw new Error('Manifest failed to load');
}

vault.dispatch(
  entityActions.modifyEntityField({
    id: manifest.id,
    type: 'Manifest',
    key: 'label',
    value: { en: ['Updated title'] },
  })
);
```

### `@iiif/helpers/vault/store`

This package exposes the underlying store factory and reducers used by the vault.

Key exports:

- `createStore`
- `reducers`
- `VaultStoreState`
- `VaultZustandStore`

The store is built with vanilla Zustand plus Redux-style reducers. Use it when you want to embed the vault state model into an existing application architecture rather than always going through the `Vault` class.

Example:

```ts
import { emptyManifest } from '@iiif/parser';
import { createStore } from '@iiif/helpers/vault/store';
import { entityActions } from '@iiif/helpers/vault/actions';

const store = createStore();
const manifestId = 'https://example.org/manifest-1';

store.dispatch(
  entityActions.importEntities({
    entities: {
      Manifest: {
        [manifestId]: {
          ...emptyManifest,
          id: manifestId,
          type: 'Manifest',
          items: [],
        },
      },
    },
  })
);

store.dispatch(
  entityActions.modifyEntityField({
    id: manifestId,
    type: 'Manifest',
    key: 'label',
    value: { en: ['An example label'] },
  })
);

console.log(store.getState().iiif.entities.Manifest[manifestId]);
```

### `@iiif/helpers/vault/utility`

This package contains lower-level utility helpers used by the vault internals and occasionally useful for advanced integrations.

Key exports:

- `actionListFromResource`
- `areInputsEqual`
- `createFetchHelper`
- `getDefaultEntities`
- `resolveIfExists`
- `resolveList`

These are useful when you want to:

- build your own fetch-to-actions pipeline
- inspect or recreate the vault's normalization defaults
- resolve reference lists against a store directly
- reuse the vault's selector-equality logic

Example:

```ts
import { Vault } from '@iiif/helpers/vault';
import { createFetchHelper } from '@iiif/helpers/vault/utility';

const vault = new Vault();

const fetchManifest = createFetchHelper(vault, async (url: string) => {
  return {
    id: url,
    type: 'Manifest',
    label: { en: ['Generated manifest'] },
    items: [],
  };
});

const manifest = await fetchManifest('https://example.org/manifest.json');
console.log(manifest?.id);
```

### `@iiif/helpers/vault/global-vault`

This is a small compatibility bridge for global/browser-based setups.

Key export:

- `getGlobalVault`

It returns `globalThis.IIIF_VAULT` if one already exists, and if not, it will try to initialize one from a global `IIIFVault` object. In modern module-based applications, `globalVault()` from `@iiif/helpers/vault` is usually the clearer API. This subpath is mostly useful when working with browser globals or legacy integration points.

Example:

```ts
import { getGlobalVault } from '@iiif/helpers/vault/global-vault';

const vault = getGlobalVault();
console.log(vault);
```

## Choosing The Right Package

If you are not sure where to start:

- start with `@iiif/helpers` for general browser-side helper work
- use `@iiif/helpers/vault` when you want normalized loading and resource access
- use `@iiif/helpers/thumbnail` and `@iiif/helpers/image-service` for image selection and delivery logic
- use `@iiif/helpers/annotation-targets` and `@iiif/helpers/content-state` for viewer/deeplink interoperability
- use `@iiif/helpers/ranges`, `@iiif/helpers/sequences`, and `@iiif/helpers/nav-date` for navigation structures
- use `@iiif/helpers/search1` and `@iiif/helpers/transcriptions` for discovery and text experiences

## Repo Docs And Demos

There are also focused notes and examples in this repository:

- [Annotation targets](./docs/annotation-targets.md)
- [Content State](./docs/content-state.md)
- [Events](./docs/events.md)
- [i18n](./docs/i18n.md)
- [Objects](./docs/objects.md)
- [Styles](./docs/styles.md)
- [Thumbnails](./docs/thumbnails.md)
- [Demos](./demos/index.html)

## Presentation 4 release candidate support

Helpers and a normalized resource Vault for IIIF Presentation 2.1, 3.0, and
the supported parts of the Presentation 4.0 release candidate.

Node.js 22 or newer is required.

```sh
pnpm add @iiif/helpers @iiif/parser
```

## Choose a Vault contract

| API | Accepted input | Normalized application model | Intended use |
| --- | --- | --- | --- |
| `Vault` | Presentation 2.1, 3.0, supported non-3D 4.0 | Presentation 3 | Existing applications; Presentation 4 Timeline resources are projected to Canvas |
| `Vault4` | Presentation 2.1, 3.0, and 4.0 | Presentation 4 | New applications that need Timeline, Scene identity, CollectionPage, or other v4 concepts |

A Vault's normalized version is fixed for its lifetime. Parser conversion
happens once when a resource is loaded; helpers consume the resulting model.

### Existing Presentation 3 applications

No version branch is needed:

```ts
import { Vault } from "@iiif/helpers/vault";

const vault = new Vault();
const manifest = await vault.loadManifest(manifestUrl);

// Canvas for v2/v3 input and for a compatible v4 Timeline projection.
const firstCanvas = vault.get(manifest.items[0]);
```

A Presentation 4 Scene cannot be represented faithfully as Presentation 3.
The compatibility path throws a
`Presentation4CompatibilityError` with structured diagnostics instead of
silently dropping it.

### Presentation 4 applications

```ts
import { Vault4 } from "@iiif/helpers/vault-4";

const vault = new Vault4();
const manifest = await vault.loadManifest(manifestUrl);
const firstContainer = vault.get(manifest.items[0]);

const presentation4 = vault.toPresentation4(manifest);
```

`firstContainer` remains a Canvas, Timeline, or Scene. `Vault4` also accepts
Presentation 2.1 and 3.0 input and upgrades it once during ingestion.

## Load reports

Both Vaults retain the detected source version. `Vault4` also retains parser
normalization warnings such as deterministic ID minting:

```ts
const report = vault.getLoadReport(manifestUrl);

// {
//   sourceVersion: 2 | 3 | 4 | "unknown",
//   diagnostics: [...]
// }
```

Reports are stored for both the requested URL and the canonical resource ID
when they differ.

## Explicit page loading

Loading a Collection or AnnotationCollection does not implicitly fetch its
pages. Page chains are an explicit Vault operation:

```ts
const collection = await vault.loadCollection(collectionUrl);
const state = await vault.loadPageChain(collection);
const members = vault.getPaginatedItems(collection);
```

CollectionPage and AnnotationPage entities remain independently addressable.
The derived member list is ordered and deduplicated. Cycles and broken links
stop safely and are exposed on `state.error`; loaded prefixes are retained.

## Helpers

Helpers are available from the root package and focused subpaths:

- `@iiif/helpers/annotation-targets`
- `@iiif/helpers/content-state`
- `@iiif/helpers/i18n`
- `@iiif/helpers/image-service`
- `@iiif/helpers/painting-annotations`
- `@iiif/helpers/ranges`
- `@iiif/helpers/sequences`
- `@iiif/helpers/thumbnail`
- `@iiif/helpers/transcriptions`

Shared helpers accept either fixed Vault profile. Canvas-specific functions
remain Canvas-specific; `findAllContainersInRange` and the Container
transcription APIs cover Canvas, Timeline, and Scene without relabeling them.
Annotation aggregate and SpecificResource semantics are resolved consistently
by painting, thumbnail, and transcription helpers.

## Deliberate Scene and Activation support

Two optional subpaths expose the first tested 3D vertical slices:

```ts
import { createSceneHelper } from "@iiif/helpers/scenes";
import { createActivationsHelper } from "@iiif/helpers/activations";

const scenes = createSceneHelper(vault4);
const paintables = scenes.getPaintables(scene);

const activations = createActivationsHelper(vault4);
const annotations = activations.getAllActivatingAnnotations(manifest);
const transaction = activations.parseActivatingAnnotation(annotations[0]);
```

The initial supported surface is intentionally narrow:

- Model paintables are returned as a known Scene paintable type.
- SpecificResource selectors, transforms, and action order are preserved.
- Activating annotations can be collected and parsed into ordered steps.
- Unrecognized Scene body types remain available as `unknown` with `rawType`.

The helpers do not compose or render Scenes, apply transforms, choose cameras,
calculate lighting, spatialize audio emitters, or execute activation actions.
Camera, light, audio-emitter, animation, and nested extension subtrees are not
normalized into helper-specific models unless a tested vertical slice is added.

## Local joint development

From this repository, link a sibling parser checkout and run the same gates
used for the coordinated release:

```sh
pnpm install --frozen-lockfile
pnpm link ../parser
pnpm run typecheck
pnpm exec vitest run
pnpm run test:presentation-4:packed
```

The packed gate builds both repositories, installs their tarballs into a fresh
offline consumer, imports every public subpath through ESM and CommonJS, and
compiles NodeNext and Bundler consumers with `skipLibCheck: false`.

## License

MIT
