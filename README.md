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

### `@iiif/helpers/events`

This is a small vault-backed event registry for IIIF resources.

Key exports:

- `createEventsHelper`

The helper gives you:

- `addEventListener(resource, event, listener, scope?)`
- `removeEventListener(resource, event, listener)`
- `getListenersAsProps(resourceOrId, scope?)`

It stores event handlers in vault meta so you can attach UI behavior to resources before they are rendered. This is especially useful in component-based UIs where passing callbacks down through many layers would otherwise be awkward.

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

const label = getValue(manifest.label, { language: 'fr' });
const summary = iiifString`Label: ${manifest.label}`;
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
import { createSearch1Store } from '@iiif/helpers/search1';

const store = createSearch1Store(searchService);
await store.getState().search({ q: '1615' });
store.getState().highlightHit(0);
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
import { createThumbnailHelper } from '@iiif/helpers/thumbnail';

const helper = createThumbnailHelper(vault);
const result = await helper.getBestThumbnailAtSize(canvas, { width: 256, height: 256 });
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

### `@iiif/helpers/vault-node`

This is the Node-oriented vault package.

Key exports:

- `Vault`
- `globalVault`
- the same core types re-exported by `@iiif/helpers/vault`

The `Vault` class in this package extends the core vault and configures a Node-friendly fetch path. Use it when you want vault behavior in server-side code and you do not want to wire a custom fetcher yourself.

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

### `@iiif/helpers/vault/store`

This package exposes the underlying store factory and reducers used by the vault.

Key exports:

- `createStore`
- `reducers`
- `VaultStoreState`
- `VaultZustandStore`

The store is built with vanilla Zustand plus Redux-style reducers. Use it when you want to embed the vault state model into an existing application architecture rather than always going through the `Vault` class.

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

### `@iiif/helpers/vault/global-vault`

This is a small compatibility bridge for global/browser-based setups.

Key export:

- `getGlobalVault`

It returns `globalThis.IIIF_VAULT` if one already exists, and if not, it will try to initialize one from a global `IIIFVault` object. In modern module-based applications, `globalVault()` from `@iiif/helpers/vault` is usually the clearer API. This subpath is mostly useful when working with browser globals or legacy integration points.

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

## License

MIT
