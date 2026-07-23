# IIIF Presentation 4.0 RC joint delivery review

Date: 2026-07-22  
Helpers branch reviewed: `feature/presentation-4` at `ef3f6ce`  
Parser branch reviewed: `feature/presentation-4.0` at `f422ee4`  
Status: joint implementation complete; coordinated publication is the remaining external action

## Completion pass — 2026-07-23

All six joint delivery phases are implemented and release-ready:

- `Vault` and `Vault4` are lifetime-stable profiles over one typed runtime.
  Parser conversion happens once at ingestion, source versions and diagnostics
  remain queryable, complete/partial merge policy is explicit, and canonical
  state carries only profile-appropriate Container property names.
- CollectionPage and AnnotationCollection page chains are explicit operations
  with independent page entities, ordered deduplication, totals/start indexes,
  safe broken/cyclic termination, and retained loaded prefixes.
- Shared aggregate resolution, Range/Container APIs, selector fidelity, i18n,
  thumbnails, content state, sequences, and transcriptions have Presentation 4
  parity coverage. Equivalent Presentation 2, 3, and 4 resources now have a
  direct shared-helper contract test on both Vault profiles.
- The copied unchecked v4 suite was removed. Presentation 4 tests live under
  `__tests__/presentation-4`, and none uses `@ts-nocheck`.
- Scene and Activation ship as narrow explicit subpaths over pinned official 3D
  fixtures. Unsupported resources remain raw and are not presented as rendered
  or executable 3D behavior.
- Parser `2.3.0` and Helpers `1.6.0` require Node 22 or newer. The fresh offline
  tarball gate checks all 41 public subpaths in ESM, CommonJS, NodeNext, and
  Bundler consumers with library checking enabled.

Registry publication was not performed by this implementation pass. Phase 6 is
prepared as the ordered handoff below and should use the exact green commits
from both repositories.

This is the Helpers/Vault companion to `parser/PRESENTATION-4-RC-IMPLEMENTATION-REVIEW.md`. The two documents describe one release project. Where they overlap, the parser review owns wire-format and normalization detail; this review owns Vault lifecycle, helper semantics, packaging, and the cross-repository release gate.

## Implementation pass — 2026-07-23

The first joint delivery slice is now implemented:

- Helpers declares the future parser `^2.3.0` peer instead of an ephemeral
  preview URL; local development uses an explicit pnpm link.
- Existing `Vault` accepts supported v4 through the parser's fixed v3
  compatibility view, while `Vault4` remains an explicit lifetime choice.
- `VaultAuto` remains source-compatible but is deprecated with its state-loss
  limitation documented.
- Vault4 stores Collection Page as a first-class entity and can load, get, wrap,
  and serialize pages without implicit fetching.
- A shared annotation-value resolver preserves Choice, Composite, List, and
  Independents paths; `expandTargets()` exposes all targets while
  `expandTarget()` retains its first-result contract.
- All new joint tests live beneath `__tests__/presentation-4`.

The next delivery pass should deduplicate the Vault/Vault4 runtime behind fixed
profiles, separate v3/v4 store types, migrate painting and other body consumers
to the shared aggregate resolver, add explicit page-chain loading, and remove
the remaining v4 `@ts-nocheck` tests. The release-confidence pass below now
provides the packed parser/Helpers gate.

## Release-confidence pass — 2026-07-23

The second joint delivery slice is implemented:

- Parser `2.3.0` and Helpers' `^2.3.0` peer range now describe the same
  coordinated candidate.
- `pnpm run test:presentation-4:packed` packs the sibling parser, installs that
  tarball into a disposable Helpers checkout, packs Helpers, and installs both
  artifacts into a second fresh strict-peer consumer. It does not depend on or
  alter the developer's local parser symlink.
- The packed test exercises the fixed v3 Vault view, the native Vault4 view,
  serialization in both versions, and the typed structured diagnostic that
  crosses the parser/Vault boundary for unsupported Scene content.
- `.github/workflows/presentation-4-joint.yml` accepts an exact parser ref,
  runs the packed test, links the two source checkouts with pnpm, and runs the
  Helpers build, typecheck, package lint, and full Node 22 test suite.
- The ordinary Helpers build and release workflows now include typecheck and
  package lint. ESM/CJS package smoke tests assert public exports without making
  a live network request.
- The shared parser oracle is pinned to IIIF/api commit
  `28a88829699ebbbe7722b4692cf3b7b67969bc6c`.

Those milestones are recorded below. The next Helpers work is first-class page
chains and removal of the remaining v4 `@ts-nocheck` suites.

## Model/runtime convergence pass — 2026-07-23

The third joint delivery slice is implemented:

- Parser validation now distinguishes reference-only Presentation resources
  from embedded resources without allowing embedded Agent, SpecificResource,
  TextualBody, or annotation aggregate requirements to be bypassed.
- The trusted pinned corpus has grown to eight representative files, and the
  full pinned non-3D example audit is green apart from the documented upstream
  embedded-service-context violation.
- `Vault4` now extends the same typed runtime as `Vault`. Its source has been
  reduced from 688 lines to the v4-specific normalization, serialization, and
  CollectionPage surface, while fixed-profile return types and subscription
  identity remain intact.
- The shared runtime carries the selected Manifest and Collection authored and
  normalized types through loading, hydration, wrapping, and pagination.
- Painting annotations, thumbnail fallback, and transcriptions now use the
  shared aggregate resolver. Composite/List/Independents retain document order,
  Choice retains deterministic selection, sibling Choice groups remain
  independent, and SpecificResource selectors remain attached to their bodies.

The next milestone should add explicit CollectionPage and AnnotationPage chain
loading to the shared runtime, including broken/cyclic link behavior, before
removing the old `@ts-nocheck` fixture suites and broadening helper parity.

It also supersedes the deleted `VAULT-3-4.md` plan. That plan led to the current replay-based `VaultAuto`; this review recommends not shipping that design.

## Executive summary

The Helpers branch has several good foundations:

- the public `Vault` remains the Presentation 3 Vault;
- an explicit `Vault4` subpath exists;
- helper factories already depend on a small `CompatVault` surface;
- many helper inputs have been widened to accept v3 and v4 types;
- the common `ContentResource` store remains the catch-all for varied bodies;
- services stay embedded rather than acquiring a speculative normalized model;
- Scene and Activation work is isolated and preserves unknown resource types.

It is not ready to ship with the parser branch. The two branches currently amplify each other's failures:

1. Default `Vault` sends v4 input directly through the v3 normalizer. A v4 Timeline is mapped as `Timeline`, stored as `Canvas`, cannot be resolved, and serializes as `"__$UNSET$__"`.
2. `VaultAuto` changes the application's data model because of a later input document. It replaces the store and replays only original loads, losing edits, metadata, subscriptions, request state, pagination state, wrappers, custom reducer state, and references previously returned by `getStore()`.
3. `Vault4` is approximately 650 copied lines of `Vault` with different parser imports. Its store declarations are still predominantly v3 types with selected v4 unions and extensive casts.
4. Body/target aggregate semantics are lost across targets, painting, thumbnails, transcriptions, Scenes, and Activations. Most code handles a direct array, a single value, or `Choice`/`List`, but not the distinct semantics of `Choice`, `Composite`, `List`, and `Independents`.
5. Collection Page support is based on the Presentation 3 paging convention. P4 pages are tested as `Collection`, `total` is used instead of `totalItems`, and real `CollectionPage` is routed to `ContentResource`.
6. The test corpus is not an RC oracle. Only 8 of 22 Helpers v4 JSON fixtures pass the current parser validator, 10 of the 11 files under `__tests__/v4-helpers` disable TypeScript checking, and several tests deliberately snapshot known semantic loss.
7. A clean install is not reproducible: the parser peer dependency is a dead `pkg.pr.new` URL with no integrity metadata. Helpers CI does not run typecheck, package type tests, fixture validation, or the two-repository compatibility matrix.

The smallest correct product is not an auto-switching Vault. It is two explicit, lifetime-stable contracts over one shared Vault engine:

```text
v2 / v3 / supported v4 ── parser v3 compatibility profile ── Vault  ── shared helpers

v2 / v3 / v4 ─────────── parser v4 native profile ───────── Vault4 ── shared helpers
                                                                      + v4-only helpers
```

`Vault` always exposes a v3-shaped model. `Vault4` always exposes a v4-shaped model. Input version never changes the consumer's selected schema.

## Joint product contracts

The normative baseline is the official [Presentation 4.0 specification](https://iiif.io/api/presentation/4.0/), [data model](https://iiif.io/api/presentation/4.0/model/), and one pinned commit of the [official example corpus](https://github.com/IIIF/api/tree/main/source/presentation/4.0/example). The parser review records the RC contradictions and canonicalization policy; Helpers must consume that policy rather than inventing a second interpretation.

### Contract A: existing v3 application, existing Vault

An application written against the current parser, `Vault`, and shared Helpers should accept a v2, v3, or supported non-3D v4 Collection/Manifest without branching on source version.

- The parser performs version detection and v4-to-v3 projection once, before v3 normalization.
- `Vault` receives a referentially complete v3 store regardless of input version.
- Existing helper results for v2/v3 remain stable.
- Timeline becomes Canvas everywhere before Vault import.
- Scene and unsupported 3D content produce structured diagnostics; they never create a partly v4 store inside `Vault`.
- Collection page links are preserved. Fetching pages remains an explicit asynchronous Vault action.
- V3 serialization is valid v3 and contains no v4 context, Timeline/Scene types, internal identifiers, or unset sentinels.

The user chooses this contract by importing the existing parser/Vault entry points. It requires no `enablePresentation4` flag and no runtime schema switch.

### Contract B: v4-native application, explicit Vault4

An application chooses the Presentation 4 model at construction time by using the parser v4 entry point and `Vault4`.

- v2 and v3 input upgrade to v4 before normalization.
- v4 input receives only documented light repair.
- Store, references, mutations, hydration, object wrapping, pagination, diagnostics, and serialization remain v4 for the lifetime of the Vault.
- Shared helpers produce the same domain result for concepts aligned across v3/v4.
- Genuinely new concepts use accurately named APIs: Timeline/Container navigation, Collection Page paging, Scene, and Activation.
- Unsupported nested 3D details remain raw/opaque and carry diagnostics rather than being partially rewritten.

The expected breaking changes are small but real: v4 annotation cardinality, Timeline/Scene Container types, Collection Page, renamed Container properties, and aggregate wrappers must not be disguised as v3 shapes.

## Current Helpers architecture

### Ingestion and stores

`src/vault/utility/action-list-from-resource.ts` is the central parser/Vault seam. It selects either root `normalize` or `/presentation-4` `normalize`, then imports `entities` and `mapping` into the store. This is the right routing point, but it currently discards v4 `sourceVersion` and diagnostics.

The runtime store keeps entity buckets, identity mapping, request state, and metadata. `Timeline` and `Scene` buckets have been appended to the old `Entities` type. Core buckets such as Manifest, Canvas, Annotation, Range, and Collection remain typed as Presentation 3, while selected v4 resources are unioned into individual fields.

### Vault variants

- `Vault` uses the root parser normalizer and v2/v3 serializers.
- `Vault4` copies the complete Vault implementation, swaps in the v4 normalizer and serializer, and adds `toPresentation4`.
- `VaultAuto` starts with `Vault`, probes every load with the v4 normalizer, and replaces the active Vault with `Vault4` when its switching rule matches. Earlier source documents are cloned into a journal and replayed.

The public package exposes `./vault`, `./vault-4`, and `./vault-auto`. Root/global Vault still means the v3 Vault.

### Helpers

Most existing helpers now import both authored and normalized v3/v4 types. Factory functions generally accept `CompatVault`, which exposes only the few Vault operations a helper needs. This structural seam is preferable to version checks inside helpers.

New Scene and Activation modules sit alongside the shared helpers. Selectors have gained Point, WKT, Animation, and z-coordinate handling. Range logic recognizes new Container type names in some paths.

## What should be kept

- Keep the existing `Vault` name and behavior as the v3 consumer contract.
- Keep explicit `Vault4` as the native opt-in contract.
- Keep one identity/mapping/request/meta store design and one action/reducer implementation.
- Keep the `actionListFromResource` normalizer injection point.
- Keep helper factories over the narrow `CompatVault` interface.
- Keep shared helpers shared when their domain output is version-neutral.
- Keep the parser's broad `ContentResource` abstraction; do not add a Vault bucket for each body subtype.
- Keep services embedded and opaque.
- Keep Scene/Activation support isolated and preserve unknown raw types.
- Keep the useful new selector parsing, after its array/style behavior is corrected.
- Keep ESM/CJS package subpaths for explicit Vault variants.

## Prioritized findings

### P0. `VaultAuto` cannot preserve a live application

`VaultAuto` chooses the consumer schema from the content of an input document. Its switch creates a new Vault and store and replays only cloned source payloads.

The failure is reproducible:

1. load a v3 Manifest;
2. modify its normalized label;
3. subscribe to the Vault;
4. load a v4 audio Manifest;
5. observe the switch to Vault4.

The edited label reverts to the source value and the original subscription no longer observes changes. The same design loses or abandons:

- dispatched edits not represented by source JSON;
- metadata, styles, event listeners, and pagination state;
- request/loading/error state and in-flight request coordination;
- emitter listeners and store subscriptions;
- reactive wrappers;
- custom reducer state;
- callers holding the previous `getStore()` result;
- any object identity assumptions made before switching.

The switching rule also does not match the deleted plan: `sourceVersion === 4` switches every v4 resource, not only Scene-bearing resources.

Required change: remove `VaultAuto` from the initial public release. If it has no demonstrated use beyond its own tests, delete it and its export. Runtime migration between two different normalized models should only return after a concrete product requires a deliberately lossy export/import operation.

Acceptance criteria:

- An application's selected Vault schema never changes because of input.
- `Vault` accepts supported v4 through the parser's v3 projection.
- `Vault4` is explicit at construction.
- No release documentation or helper requires `VaultAuto`.

### P0. Default Vault inherits the parser's broken v4 path

`actionListFromResourceV3` calls the root parser `normalize`. Today that is a v2-to-v3 route, not a v4 compatibility route.

Loading the v4 audio fixture through `Vault` produces:

- a Manifest item reference typed `Timeline`;
- `mapping[timelineId] = "Timeline"`;
- no resolvable Timeline entity in the v3 store;
- `toPresentation3()` output containing `items: ["__$UNSET$__"]`.

This is the parser review's first release blocker expressed at the real consumer boundary.

Required change: land the parser v4-to-v3 adapter first, then test it through the unchanged public `Vault`. Helpers must not add Timeline handling to the v3 Vault to compensate for a malformed store.

Acceptance criteria:

- Equivalent v2, v3, and v4 non-3D resources produce equivalent v3 Vault state and helper results.
- Every mapping resolves to the declared bucket/entity.
- Timeline is projected consistently to Canvas before import.
- Unsupported Scene input is observable through structured diagnostics.

### P0. `Vault4` duplicates the engine but not its types

`src/vault/vault.ts` and `src/vault/vault4.ts` are each roughly 650 lines. Their meaningful differences are normalizer selection, serializer selection, and public types. Copying loading, events, batching, fetching, hydration, pagination, metadata, object wrapping, and mutation logic creates two places for every fix.

The shared `Entities`/`IIIFStore` declaration is not actually shared semantics. It mixes Presentation 3 core entities with selected Presentation 4 unions. `Vault4` then casts its normalizer, state, serialization, wrapper, and generic returns through `any`. Only some Manifest/Collection return types are overridden; Canvas, Annotation, Range, and other conditional types remain v3-oriented.

`defaultState` can also seed either Vault with the same unbranded state, allowing a v3 store to be passed to Vault4 silently.

Required change: use one runtime Vault engine parameterized by a small parser profile:

- normalize/action-list function;
- entity-store type/defaults;
- wire serializers supported by the profile;
- page type/cardinality differences;
- version label and diagnostics type.

Expose two thin typed facades, `Vault` and `Vault4`. Import v4 entity/store types from the parser rather than recreating them as selected unions. Brand or discriminate persisted/default state by normalized version.

Acceptance criteria:

- Loading, event, request, metadata, mutation, and wrapper code exists once.
- `IIIFStoreV3` cannot initialize Vault4 and `IIIFStoreV4` cannot initialize Vault.
- `get`, `hydrate`, `load*`, `getObject`, subscription state, and serialization infer the selected profile without caller-selected unchecked generics.
- Runtime type-to-store routing is shared with, or exhaustively checked against, the parser's mapping policy.

### P0. The fixture/test corpus encodes preview behavior

The Helpers repository has 22 Presentation 4 JSON fixtures. Running the sibling parser's current validator reports 8 valid and 14 invalid. The validator itself still has RC-policy issues documented in the parser review, but several failures are unambiguous:

- all four `fixtures/presentation-4/cookbook` documents use direct arrays for annotation `body` and `target`;
- Scene fixtures include preview-era array `source` values and other obsolete shapes;
- generated fixtures contain `vault://iiif-parser/...` identities and abstract/internal `ContentResource` wire types;
- `exhibitions--novieten.json` alone contains 24 internal `vault://iiif-parser/...` occurrences.

The P4 paging test is the old P3 convention with a v4 context: pages and `first` are typed `Collection`, it uses `total`, repeats contexts, and repeats the base Collection ID. The test snapshots this as success.

Ten of the eleven files under `__tests__/v4-helpers` begin with `// @ts-nocheck`. The helper seed builder imports the root v3 `emptyManifest` and casts it to v4. Large copied test suites therefore increase test count without proving typed v4 compatibility.

Required change: use the same pinned official RC corpus and valid self-seeds as the parser. Generated upgrade outputs are test results, not source truth. Validate every positive v4 input before loading it into Vault.

Acceptance criteria:

- Positive fixtures validate under the recorded RC policy before helper assertions run.
- Negative fixtures live in a named negative corpus and assert specific code/path failures.
- No v4 helper test uses `@ts-nocheck`.
- Wire fixtures contain no `vault://`, `iiif-parser:*`, unset sentinel, abstract internal type, or source array.
- One provenance manifest records the official IIIF/api commit and fixture checksums for both repositories.

### P0. Collection Page and paging are modeled as v3 Collections

`resolveType("CollectionPage")` currently returns the `ContentResource` bucket. `Vault4.getPaginationState` reads `total`, and `loadNextPage` loads a page as a Collection, stores page metadata with `type: "Collection"`, and appends its items directly to the root.

With an RC-shaped Collection and Collection Page, the current path loses `totalItems`, changes the first-page type, and can append a Manifest reference whose entity was never normalized.

Required joint change:

- Parser: first-class `CollectionPage` traversal, normalized representation, identity mapping, and serialization.
- Vault: preserve actual page entities and links; merge loaded item references into the owning Collection without changing the page's identity/type.
- Pagination adapter: read the profile's total property (`total`/`totalItems` under the final recorded policy) and page type.
- Annotation Collection paging: use the same pagination core rather than a second implementation.

Acceptance criteria:

- Inline Collection, standalone Collection Page, linked page chain, Annotation Collection pages, empty page, and broken/cyclic links are tested.
- Pure parser/Vault loading never performs implicit page fetches.
- Page fetch preserves request state, page identity, item mapping, start index, next/prev, and deduplication.

### P0. Aggregate and Specific Resource semantics are discarded in helpers

The v4 data model uses one body/target object and aggregate wrappers. Current behavior is fragmented:

- `expandTarget` selects only the first direct/aggregate target and loses options on its array recursion.
- Painting handles Choice but not Composite, List, or Independents.
- Thumbnail and transcription can treat an aggregate wrapper as if it were a content body.
- Scene and Activation unwrap only `List`.
- `VaultAuto.resolveAnnotationBodies/Targets` does not recursively expand aggregates and is not used by shipped helpers.
- Different modules repeat small `asArray`, List unwrapping, and Specific Resource parsing implementations.

Required change: create one small, shared annotation-value resolver used by both Vault profiles and all relevant helpers. It must preserve:

- aggregate kind and item order;
- Choice default and selected alternatives;
- List/Composite/Independents distinctions;
- Specific Resource source;
- selector/refinement arrays;
- transform/action order;
- language/style class;
- authored versus normalized identity;
- raw unsupported fields.

Keep `expandTarget` as a documented first-result compatibility wrapper. Add an `expandTargets`/structured result for callers that need all semantics. Do not flatten every aggregate into an undifferentiated array.

Acceptance criteria:

- The four aggregate classes have shared helper contract tests.
- V3 multiple bodies/targets upgraded to Independents produce the expected helper results.
- Painting, target expansion, thumbnail, transcription, Scene, Activation, and content state all use the same resolver.
- Resolution never mutates authored or normalized input.

### P0. The packages cannot currently be released together reproducibly

`package.json` declares the parser peer as a `pkg.pr.new` URL. The URL now returns 404, the lock entry has no integrity, and modern package managers reject or cannot reproduce it. A peer dependency should describe consumer compatibility, not point at an ephemeral PR artifact.

The current GitHub build workflow runs install, build, tests, old package-load scripts, and preview publication. It does not run typecheck, package lint, fixture validation, package type tests, or the joint parser/Helpers matrix. Release CI has similar omissions.

Required change:

- use a semver parser peer range for published Helpers;
- use a normal dev dependency for local type/build tests;
- in joint CI, build and pack the exact parser checkout and install that tarball into the exact Helpers checkout;
- after registry publication, rerun the same matrix against registry tarballs;
- never use a mutable preview URL as the compatibility contract.

Acceptance criteria:

- Fresh offline-capable installs work from lockfile/cache with integrity metadata.
- Isolated consumers install packed parser and Helpers tarballs and typecheck with `skipLibCheck: false`.
- ESM and CJS import every public subpath without network calls.
- The peer range is tested at its lower supported version and current release candidate.

### P1. Merge and alias heuristics corrupt canonical state

`quickMerge` refuses to replace an existing value with `null` or an empty array. This prevents placeholder defaults from clobbering rich existing data, but it also prevents an authoritative reload or edit from intentionally clearing items and nullable properties.

The entity reducer mirrors `placeholderCanvas`/`placeholderContainer` and `accompanyingCanvas`/`accompanyingContainer` into duplicate mutable fields. This contaminates the canonical v4 store and creates ordering/conflict questions when the aliases differ.

Required change:

- Make merge behavior depend on provenance: full authored resource, partial reference/frame, or local mutation.
- Preserve explicit empty/null from a complete authoritative resource.
- Use the parser profile to produce the canonical property name for each Vault.
- If a helper needs to read either version outside Vault, use a read-only fallback function; do not mirror duplicate fields in state.

### P1. Type-to-store routing is duplicated and incomplete

Helpers' `resolveType` independently maps content types to buckets. It includes some aggregate, transform, light, and audio types, but misses other values such as `Audio`, `Model`, `TextualBody`, and `Choice` in direct-reference paths. `CollectionPage` is deliberately mapped to the wrong fallback bucket.

Parser normalization often hides this because its references use the abstract `ContentResource` bucket type. Direct user calls such as `get({id, type: "Model"})` can still resolve differently.

Required change: export or generate one type-to-store policy from the parser normalized model and consume it in Helpers. Add an exhaustive test for every supported authored type and unknown extension fallback.

### P1. Several shared helpers claim v4 support without v4 semantics

#### Range and sequence

- `getManifestSequence` casts all Manifest items to Canvas references, allowing Timeline/Scene to escape through a Canvas-only return type.
- `findAllCanvasesInRange` misses direct Canvas references and can add a Specific Resource Canvas twice.
- another Range path casts Timeline and Scene to Canvas.
- the v4 Range snapshot records six lost Canvas labels as the new expected output because direct references are not hydrated before reading their label.

Keep existing sequence functions Canvas-only. Filter/reject other Containers accurately. A generic `findAllContainersInRange` is justified for nested v4 Ranges; a separate “manifest containers” helper is unnecessary because `manifest.items` already provides it.

#### Targets and selectors

Selector arrays are valid v4 data, but recursive selector parsing fails to pass `loadedStylesheets`, so CSS style resolution changes when more than one selector is present. `expandTarget` mutates `partOf`/source objects and does not preserve target transform/action.

Return new objects, propagate options through recursion, and expose all targets without changing the old first-result API.

#### I18n

Language-map value access is structurally aligned and is a strength. Resource traversal is not: it imports the root v3 `Traverse`, which cannot understand Timeline/Scene and v4-only branches, and it expects scalar resource language where v4 uses an array.

Use a version-neutral, cycle-safe property walk limited to language-bearing positions, or inject the selected parser traversal.

#### Thumbnail

Thumbnail handling has an inverted Choice condition that can report not-found when a first Choice item exists. It does not understand all aggregates and temporarily writes Canvas dimensions onto hydrated content resources, mutating Vault state.

Pass fallback dimensions as function arguments. Add a no-mutation assertion around every thumbnail call.

#### Transcription and content state

Transcription APIs are Canvas-named and miss Timeline-native audio use cases and aggregate bodies. Introduce Container/Timeline-capable internals and keep Canvas aliases for compatibility. Content-state normalization accumulates motivations but returns a different expression that can lose additional motivations; its internal target list must not be treated as canonical v4 wire shape.

#### Search, styles, and Image API helpers

These are largely version-neutral. Keep them structurally typed. Image API service handling already respects the desired opaque-service boundary.

### P1. V4 object wrappers encode v3 cardinality

`ReactiveWrapped` treats properties such as `body`, `start`, `supplementary`, placeholder/accompanying Container, and several links as arrays. V4 makes some of these singular objects. `Vault4` passes itself into the v3-oriented wrapper through casts, and its type test only expects `Promise<unknown>` for a wrapped Manifest.

Either make the wrapper profile-aware with tested property cardinality, or exclude v4 object wrappers from the first native release. Do not claim a typed API whose declaration erases the important v4 distinction.

### P1. Diagnostics disappear at the Vault boundary

The v4 parser returns `sourceVersion` and structured diagnostics. `toActionList` imports only entities, mapping, and root identity. Vault users therefore cannot observe repairs, unsupported 3D, omissions, or policy warnings after load.

Store the normalization report under request/resource metadata and expose a small `getDiagnostics(id)`/load-report path without changing the existing resource return value. Diagnostics must survive asynchronous loads and requested-ID/resource-ID mismatches.

### P1. Scene and Activation are promising but not a core-release proof

The new modules preserve selector, transform, action, unknown type names, and ordered activation steps. That is a useful vertical-slice direction.

Current coverage is three Scene tests and one direct Activation parse. It does not cover valid RC wire shapes, aggregate classes, choices/defaults, `getAllActivatingAnnotations`, target actions/transforms, audio emitters, image-based light, or the parser serializer's current 3D losses. Scene types also duplicate partial resource declarations instead of relying on an accurate parser model.

Keep this layer optional until the two non-3D contracts are green. Publish it through explicit `./scenes` and `./activations` subpaths if it is included. Claim only demonstrated Model/light/camera/activation support; preserve all other nested 3D as unknown/raw with diagnostics.

### P1. Package tests and documentation do not cover the new API

- README remains `TBC` and has no two-mode migration guide.
- Older docs show obsolete package names and Presentation 3-only assumptions.
- package smoke tests do not import `vault-4`, `vault-auto`, Scene, or Activation.
- the CJS smoke test performs a live external fetch and makes no assertion.
- TypeScript package tests are not run by CI.
- published declarations refer to packages that are only dev dependencies, which needs an isolated-consumer check.
- CI was reduced to Node 22 while the package declares no Node engines range; Node 24 exposes six brittle exact floating-point snapshots not seen on Node 22.

Package smoke tests should be deterministic, offline, assertion-based, and cover every export in ESM, CJS, and TypeScript NodeNext/Bundler modes.

### P2. The branch is too broad and the copied tests obscure coverage

The Helpers branch changes 111 files with approximately 41,415 insertions and 623 deletions. Much of that is copied fixtures, copied v4 test suites, and two copied Vault implementations. The branch has 18 commits but no retained current plan document.

Split the next pass by contract and subsystem. Prefer one table-driven helper contract suite over duplicated v3/v4 files. Fewer tests with independent valid seeds and semantic assertions provide more confidence than thousands of copied lines with typechecking disabled.

## Ownership across the two repositories

| Concern | Parser owns | Helpers owns | Joint gate |
| --- | --- | --- | --- |
| Version detection and upgrade/downgrade | Yes | No | Inputs select the requested profile, never the consumer schema implicitly. |
| Wire types, cardinality, validation, serialization | Yes | No | Serialized Vault resources validate with no internal leaks. |
| Normalized entity/store schema and type-to-store mapping | Source of truth | Imports/hosts state | Mapping closure and exact schema compatibility. |
| Loading, requests, events, metadata, mutation, paging fetch | No | Yes | Parser output remains correct after Vault lifecycle operations. |
| Annotation aggregate semantics | Represents/preserves | Resolves for domain helpers | Same semantic results across equivalent v2/v3/v4 inputs. |
| Services and unknown extensions | Preserves opaque | Does not reinterpret | Round-trip/no-mutation assertions. |
| Shared helper domain behavior | No | Yes | Vault and Vault4 contract suite. |
| Scene/Activation | Accurate types/preservation | Optional domain helpers | Valid vertical-slice fixtures and explicit unsupported behavior. |
| Fixture provenance | Canonical pinned corpus | Consumes/subsets | Same IIIF/api SHA/checksums. |
| Package compatibility | Parser tarball | Helpers tarball and peer | Install and test exact pair before either stable release. |

## Recommended architecture

### One engine, two profiles, two public classes

```text
                         Parser profile
                    ┌──────────────────────┐
wire input ─────────► normalize + mapping  │
                    │ serializers          │
                    │ diagnostics          │
                    │ entity store types   │
                    └──────────┬───────────┘
                               │ action list
                    ┌──────────▼───────────┐
                    │ shared Vault engine  │
                    │ load/request/events  │
                    │ store/meta/mutation  │
                    │ hydrate/pagination   │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          typed `Vault` facade        typed `Vault4` facade
             fixed P3 store              fixed P4 store
```

Do not make the shared engine choose a profile at runtime. The constructor/facade fixes it once.

### Store contract

- Parser exports `Presentation3Entities` and `Presentation4Entities` plus mapping keys and normalized result/report types.
- Helpers defines `IIIFStoreV3` and `IIIFStoreV4` around those exact entity maps.
- Persisted/default state has a normalized-version discriminator.
- Content Resource subtypes map through the parser-owned policy.
- Collection Page is first-class.
- Services remain embedded; the v4 store does not add a Service bucket merely because the v3 store had one.
- Normalization diagnostics/source version are retained as metadata.

### Helper contract

Keep `CompatVault`, but type it as the minimal structural operations helpers actually call rather than as aliases of v3 overloaded methods. Shared helpers should accept small structural inputs (`id`, `type`, relevant properties) instead of repeating exhaustive `P3 | P4 | P3Normalized | P4Normalized` unions in every file.

Add one shared resolver for annotation values and Range items. Reuse it across painting, targets, thumbnail, transcription, Scene, and Activation. This is the root-cause fix for the current duplicate List/Choice handling.

Only add a new public helper when the concept is genuinely new:

- `findAllContainersInRange` for Timeline/Scene-aware nested Ranges;
- Container/Timeline transcription aliases if Timeline content is a demonstrated use case;
- Scene and Activation helpers under explicit v4 subpaths.

Do not add a helper for reading `manifest.items` or a general abstraction for every v4 class.

## Joint test and validation strategy

### One canonical corpus

The parser repository should own the pinned fixture manifest:

1. exact official v4 examples from one IIIF/api commit;
2. existing v2/v3 fixtures;
3. small independently authored valid v4 seeds;
4. one-rule negative mutants;
5. generated upgrade outputs written to temporary/generated locations only.

Helpers should consume the same commit/checksums in joint CI. Avoid a third fixture package unless duplication demonstrably becomes a maintenance problem.

### Required matrix

| Input | Parser target | Vault | Expected Helpers contract |
| --- | --- | --- | --- |
| v2 | v3 compatibility | Vault | Existing v3 behavior unchanged |
| v3 | v3 compatibility | Vault | Existing v3 behavior unchanged |
| v4 non-3D | v3 compatibility | Vault | Domain-equivalent v3 behavior; Timeline projected to Canvas |
| v4 3D | v3 compatibility | Vault | Explicit unsupported diagnostics; no malformed partial store |
| v2 | v4 native | Vault4 | Upgraded v4 state and domain-equivalent helpers |
| v3 | v4 native | Vault4 | Upgraded v4 state and domain-equivalent helpers |
| v4 non-3D | v4 native | Vault4 | Native v4 state and helpers |
| v4 3D | v4 native | Vault4 | Claimed vertical slices work; unsupported details remain raw/diagnosed |

### Assertions in every supported cell

1. Validate source independently when it claims to be v4.
2. Normalize through the public parser entry point.
3. Assert every mapping/reference resolves to the declared store.
4. Load through the public Vault entry point.
5. Assert source input is unchanged.
6. Exercise get/hydrate plus representative helpers.
7. Mutate a supported field and assert subscriptions/events fire once.
8. Serialize the target version.
9. Reject internal IDs/keys, abstract wire types, null placeholders, and unset sentinels.
10. Validate serialized output.
11. Compare semantic results and deterministic second round trip.

Representative shared helpers:

- painting and aggregate selection;
- target/selector expansion;
- Range/table of contents;
- Canvas sequences;
- thumbnail/Image API;
- i18n;
- content state;
- transcription/search where relevant;
- styles/events metadata.

### Vault lifecycle suite

Run the same engine tests for both profiles:

- requested ID differs from resource ID;
- concurrent duplicate load and retry after error;
- complete reload versus partial reference merge;
- explicit empty/null clears a complete resource;
- batch/async batch ordering;
- event and subscription before/after dispatch;
- custom reducer/default state with correct version;
- reactive wrapper cardinality;
- page loading, deduplication, broken/cyclic links;
- serialize after mutation;
- diagnostics preserved through static and remote load.

### Helper semantic seeds

- Choice, Composite, List, and Independents bodies/targets.
- Specific Resource with selector array, refined selector, transform, action, language, and absent authored ID.
- Range with direct Container, Specific Resource Container, nested Range, missing label framing, and cycles.
- Canvas/Timeline audio transcription.
- thumbnail Choice and Canvas fallback dimensions with no state mutation.
- language arrays on Timeline/Scene and nested resources.
- opaque service and GeoJSON extension.
- valid Collection Page and Annotation Collection paging.
- Model, camera/light, unknown Scene resource, and activating Annotation if 3D helpers ship.

### Package matrix

The joint CI job should:

1. check out exact parser and Helpers commits;
2. build/test/typecheck/validate parser;
3. pack parser;
4. install the parser tarball into Helpers;
5. build/test/typecheck/validate Helpers;
6. pack Helpers;
7. install both tarballs into fresh isolated ESM, CJS, NodeNext, and Bundler consumers;
8. import every public subpath and compile representative usage with `skipLibCheck: false`;
9. run without external network access.

## Delivery sequence

### Phase 0: make the pair reproducible

- Pin the RC source corpus and policy.
- Restore valid immutable fixtures and remove internal generated wire data.
- Replace the dead parser preview peer with semver plus an exact joint-CI tarball.
- Remove `@ts-nocheck` from seed builders and core v4 tests.
- Add typecheck, package lint/types, fixture validation, and joint matrix to CI.
- Remove the accidental production import from the private version-hashed Vitest module.

Exit: both clean checkouts install and test together from exact sources, and a positive fixture means valid authored input.

### Phase 1: ship Contract A end to end

- Parser lands the v4-to-v3 non-3D projection.
- Existing `Vault` imports the resulting v3 store without new v4 buckets or aliases.
- Preserve parser diagnostics in Vault metadata.
- Run equivalent v2/v3/v4 resources through existing Helpers.
- Fix helper bugs exposed by semantic parity, not by version branches.

Exit: an unchanged v3 application can load supported v4 and receive the same Vault/helper contract, with Timeline projected and 3D explicit.

### Phase 2: stabilize Contract B core

- Align parser v4 types/normalizer/serializer first.
- Replace duplicated Vault4 implementation with the shared engine and typed v4 profile.
- Remove duplicate alias state and value-based merge heuristics.
- Make annotation aggregate/Specific Resource resolution shared.
- Cover all core Vault methods and object-wrapper policy.

Exit: v2/v3/v4 non-3D input loads into a fixed v4 store, survives mutation, serializes valid v4, and exposes accurate public types.

### Phase 3: shared helper parity

- Replace copied v4 suites with a profile-driven contract suite.
- Correct Range hydration/container semantics, selector arrays, i18n traversal, thumbnail mutation/Choice, transcription Timeline support, and content-state motivations.
- Keep version-neutral helpers structurally typed.

Exit: equivalent resources give equivalent domain outputs through Vault and Vault4, except for documented v4-only concepts.

### Phase 4: first-class paging

- Parser adds Collection Page/Annotation Collection page runtime support.
- Shared Vault engine adds profile-aware page loading without implicit fetch.
- Test chains, deduplication, `startIndex`, totals, broken links, and serialization.

Exit: page entities and aggregated Collection state remain independently correct in both profiles.

### Phase 5: optional Scene/Activation vertical slices

- Rebase Scene/Activation on the shared annotation resolver and accurate parser types.
- Use valid pinned 3D seeds.
- Add explicit package subpaths and documentation.
- Support only demonstrated resource/component types; retain unknown raw data and diagnostics.

Exit: every advertised 3D helper result has parse, Vault, helper, mutation where applicable, and serialization/preservation tests.

### Phase 6: coordinated publication

- Publish the parser release candidate first.
- Run Helpers' full matrix against the registry parser tarball.
- Publish Helpers release candidate without reusing the existing `1.5.8` version.
- Test both registry candidates in isolated consumers.
- Publish stable parser, then stable Helpers, only from the same green compatibility manifest.

Record the exact parser version range, exact pair tested, supported Node range, specification/fixture SHA, supported feature table, and known 3D exclusions.

## Initial review verification snapshot

The following was measured during this review using Helpers HEAD and the sibling parser HEAD linked locally because the committed preview dependency is unavailable:

| Check | Result |
| --- | --- |
| Helpers branch scope | 111 files, approximately +41,415 / -623 |
| Parser fixture validation over Helpers v4 corpus | **8 valid / 14 invalid** |
| Node 22 Vitest with current parser branch | **276/278 pass; 2 failures caused by parser/Helpers shape drift** |
| Node 24 Vitest | **8 failures, including six brittle floating-point snapshots** |
| Build | Pass |
| `publint` | Pass with missing `engines.node` suggestion |
| Typecheck | **Fail: unused private Vitest-module import in production `search1.ts`** |
| Fresh install from committed dependency | **Blocked: dead preview peer URL / missing integrity** |

The runtime pass count is useful evidence that much existing behavior remains intact. It is not a conformance result: invalid fixtures, disabled TypeScript checking, copied snapshots, unchecked generic returns, and a locally linked unpublished parser can all hide release failures.

## Final verification snapshot

The completion pass was verified on Node 24 with the sibling parser linked
through pnpm:

| Command | Result |
| --- | --- |
| `pnpm exec vitest run` | Pass: 34 files, 251 tests |
| `pnpm run typecheck` | Pass |
| `pnpm run build` | Pass |
| `pnpm run lint` | Pass |
| Presentation 4 `@ts-nocheck` audit | Pass: none |
| `pnpm run test:presentation-4:packed` | Pass: parser 2.3.0 + Helpers 1.6.0, 41 public subpaths |
| Parser full suite | Pass: 37 files, 423 tests |
| Parser authored/converted fixture type gates | Pass: 33/33 and 99/99 |
| Parser authored and converted normalized fixture gate | Pass: 132/132 |
| Parser converted-fixture validation | Pass: 99/99 valid |

## Definition of done

- [x] `Vault` and `Vault4` are the only initial stable Vault contracts.
- [x] A Vault's normalized version is fixed for its lifetime.
- [x] Parser conversion occurs once at ingestion, never independently in helpers.
- [x] Default Vault accepts v2/v3/supported-v4 and remains genuinely v3-shaped.
- [x] Vault4 accepts v2/v3/v4 and remains genuinely v4-shaped.
- [x] One runtime Vault engine implements loading, requests, events, metadata, mutation, hydration, and paging.
- [x] V3 and v4 store/entity types are separate and parser-owned at the schema boundary.
- [x] Every mapping/reference resolves; no sentinel/internal identity reaches output.
- [x] Diagnostics and source-version information survive Vault loading.
- [x] Complete resources can explicitly clear nullable/list fields; partial references cannot erase rich entities.
- [x] Canonical state contains one version-appropriate Container property name.
- [x] Collection Page and Annotation Collection paging are first-class.
- [x] Aggregate and Specific Resource semantics are resolved once and reused by all helpers.
- [x] Existing Canvas/sequence helpers never label Timeline/Scene as Canvas.
- [x] Shared helper results are semantically equivalent across equivalent v2/v3/v4 resources.
- [x] Helpers never mutate Vault state during read-only resolution.
- [x] Positive fixtures validate and carry pinned provenance/checksums.
- [x] No v4 test uses `@ts-nocheck`.
- [x] Scene/Activation support claims only tested vertical slices and preserves unsupported raw data.
- [x] Parser and Helpers install, build, typecheck, test, package, and run together from exact tarballs.
- [x] Every public subpath works in ESM, CJS, NodeNext, and Bundler consumers without network access.
- [x] Documentation explains both contracts, migration, diagnostics, paging, and 3D exclusions.

## Final release recommendation

Publish parser `2.3.0`, run this repository's packed and linked gates against
that exact registry artifact, then publish Helpers `1.6.0`. Test both published
artifacts in the same isolated consumer before promoting either release. Record
Node `>=22`, IIIF/api fixture commit
`28a88829699ebbbe7722b4692cf3b7b67969bc6c`, and the documented Scene/Activation
exclusions in the release notes.
