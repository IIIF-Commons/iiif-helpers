# IIIF Helpers → Presentation 4 Migration Plan

## Overview

This document outlines the plan for migrating `@iiif/helpers` (Vault) to support IIIF Presentation 4 internally, while maintaining full backwards compatibility for existing consumer code.

**Core principle**: Code written against iiif-helpers today MUST NOT break. Users just update the libraries.

**Parser dependency**: `pnpm i https://pkg.pr.new/IIIF-Commons/parser/@iiif/parser@60`

---

## Table of Contents

1. [Architecture Summary](#1-architecture-summary)
2. [Breaking Changes Inventory](#2-breaking-changes-inventory)
3. [Phase 1: Dependency & Type Migration](#phase-1-dependency--type-migration)
4. [Phase 2: Store & Entity Expansion](#phase-2-store--entity-expansion)
5. [Phase 3: Normalizer Swap (P3 → P4)](#phase-3-normalizer-swap-p3--p4)
6. [Phase 4: Canvas Compatibility Layer](#phase-4-canvas-compatibility-layer)
7. [Phase 5: Serialization & Export](#phase-5-serialization--export)
8. [Phase 6: Fixtures & Smoke Tests](#phase-6-fixtures--smoke-tests)
9. [Phase 7: Type Package Removal](#phase-7-type-package-removal)
10. [Testing Strategy](#testing-strategy)
11. [Potential Parser Changes Needed](#potential-parser-changes-needed)
12. [Rollout Checklist](#rollout-checklist)

---

## 1. Architecture Summary

### Current Flow (P3)
```
Input JSON (P2/P3) → normalize() [P3] → Entities Store (P3 shape) → Vault.get() → P3 Normalized types
                                                                    → serialize() → P2 or P3 JSON
```

### Target Flow (P4)
```
Input JSON (P2/P3/P4) → normalize() [P4] → Entities Store (P4 shape) → Vault.get() → P4 Normalized types
                                                                       → serialize() → P2, P3, or P4 JSON
```

### Key Structural Differences: P3 vs P4 Entities

| P3 Store Keys | P4 Store Keys | Notes |
|---|---|---|
| Collection | Collection | Same |
| Manifest | Manifest | Same |
| Canvas | Canvas | Still exists, but now shares space with Timeline/Scene |
| — | Timeline | **NEW** - was a Canvas with duration in P3 |
| — | Scene | **NEW** - 3D container, no P3 equivalent |
| AnnotationPage | AnnotationPage | Same |
| AnnotationCollection | AnnotationCollection | Same |
| Annotation | Annotation | `motivation`/`target` now always arrays |
| ContentResource | ContentResource | Gains Model, Dataset, scene components |
| Range | Range | Items can reference Timeline/Scene |
| Service | Service | Same |
| Selector | Selector | Gains PointSelector, WktSelector, AnimationSelector |
| Agent | Agent | Was `ResourceProvider` in P3 normalized |
| — | Quantity | **NEW** - spatial/temporal scales |
| — | Transform | **NEW** - RotateTransform, ScaleTransform, TranslateTransform |

### Key Property Renames (P3 → P4)
- `placeholderCanvas` → `placeholderContainer`
- `accompanyingCanvas` → `accompanyingContainer`
- `motivation: string` → `motivation: string[]`
- `target: string | object` → `target: object[]`
- `body: object` → `body: object[]`

---

## 2. Breaking Changes Inventory

### Changes in Vault (user-facing, MUST be backwards compatible)

| Area | Change | Compat Strategy |
|---|---|---|
| `Vault.get({type:'Canvas'})` | P4 may store as Timeline/Scene | Fallback search across container stores |
| `Vault.get()` return types | Returns P4 normalized shape | Type aliases + compatible shapes |
| `Entities` type | Gains Timeline, Scene, Quantity, Transform | Additive — existing keys unchanged |
| `toPresentation3()` | Now serializes from P4 store | Uses P4's `serializeConfigPresentation3` (handles downgrade) |
| Annotation shapes | `motivation`/`target` always arrays | Existing code may assume string; P3 normalize already arrays |
| `placeholderCanvas` | Renamed to `placeholderContainer` | Add getter alias or keep both |

### Potential Parser Changes Needed

See [Section 11](#potential-parser-changes-needed) for details.

---

## Phase 1: Dependency & Type Migration

### Goal
Replace `@iiif/presentation-3`, `@iiif/presentation-3-normalized`, and `@iiif/presentation-2` type packages with types from `@iiif/parser`.

### Tasks

#### 1.1 Update `package.json`

```json
{
  "peerDependencies": {
    "@iiif/parser": "^2.2.9"
  },
  "dependencies": {
    "@types/geojson": "7946.0.13"
  }
}
```

**Remove** from `dependencies`:
- `@iiif/presentation-2`
- `@iiif/presentation-3`
- `@iiif/presentation-3-normalized`

**Remove** from `resolutions` and `overrides`:
- All `@iiif/presentation-3` overrides

#### 1.2 Create Import Mapping Guide

All imports must be remapped:

| Old Import | New Import |
|---|---|
| `from '@iiif/presentation-3'` | `from '@iiif/parser/presentation-3/types'` |
| `from '@iiif/presentation-3-normalized'` | `from '@iiif/parser/presentation-3-normalized/types'` |
| `from '@iiif/parser'` | `from '@iiif/parser'` (unchanged, but now also has P4) |
| `from '@iiif/parser/upgrader'` | `from '@iiif/parser/upgrader'` (unchanged) |

Specific type remappings:
- `ResourceProvider` → still exported from `@iiif/parser/presentation-3/types`
- `ResourceProviderNormalized` → still exported from `@iiif/parser/presentation-3-normalized/types`

#### 1.3 Files to Update (import paths)

Every file importing from the old packages needs updating. Key files:

**Direct `@iiif/presentation-3` imports** (~20 files):
- `src/vault/types.ts` — Core type definitions
- `src/vault/vault.ts` — Vault class
- `src/vault/store/reducers/entities-reducer.ts`
- `src/vault/utility/is-reference-list.ts`
- `src/vault/utility/resolve-if-exists.ts`
- `src/vault/utility/action-list-from-resource.ts`
- `src/i18n.ts`
- `src/ranges.ts`
- `src/shared-utilities.ts`
- `src/annotations.ts`
- `src/content-state.ts`
- `src/events.ts`
- `src/fetch.ts`
- `src/image-service/*.ts` (many files)
- `src/painting-annotations/*.ts`
- `src/annotation-targets/*.ts`
- `src/sequences.ts`
- `src/thumbnail.ts`
- `src/transcriptions.ts`
- `src/nav-date.ts`
- `src/search1.ts`

**Direct `@iiif/presentation-3-normalized` imports** (~10 files):
- `src/vault/types.ts`
- `src/vault/vault.ts`
- `src/painting-annotations/helper.ts`
- `src/painting-annotations/types.ts`
- `src/ranges.ts`
- `src/sequences.ts`
- `src/thumbnail.ts`
- `src/transcriptions.ts`
- `src/nav-date.ts`
- `src/search1.ts`

#### 1.4 Verification

```bash
# After all imports are updated:
pnpm run typecheck
pnpm run test
```

---

## Phase 2: Store & Entity Expansion

### Goal
Add new P4 entity stores (Timeline, Scene, Quantity, Transform) to the Vault's internal state while keeping the existing stores intact.

### Tasks

#### 2.1 Update `Entities` type (`src/vault/types.ts`)

```typescript
export type Entities = {
  // Existing (unchanged)
  Collection: { [id: string]: CollectionNormalized };
  Manifest: { [id: string]: ManifestNormalized };
  Canvas: { [id: string]: CanvasNormalized };
  AnnotationPage: { [id: string]: AnnotationPageNormalized };
  AnnotationCollection: { [id: string]: AnnotationCollection };
  Annotation: { [id: string]: AnnotationNormalized };
  ContentResource: { [id: string]: ContentResource };
  Range: { [id: string]: RangeNormalized };
  Service: { [id: string]: any };
  Selector: { [id: string]: Selector };
  Agent: { [id: string]: ResourceProviderNormalized };

  // NEW P4 stores
  Timeline: { [id: string]: any };   // P4 Timeline container
  Scene: { [id: string]: any };      // P4 Scene container (3D)
  Quantity: { [id: string]: any };   // P4 Quantity (spatial/temporal scale)
  Transform: { [id: string]: any };  // P4 Transform (rotate/scale/translate)
};
```

> **Note**: Using `any` initially for new types to avoid coupling too tightly to P4 normalized types. These can be narrowed later once the P4 normalized type contract stabilizes. Alternatively, use `NormalizedEntityV4` from `@iiif/parser/presentation-4-normalized/types`.

#### 2.2 Update `NormalizedEntity` union type (`src/vault/types.ts`)

Add to the union:
```typescript
export type NormalizedEntity =
  | CollectionNormalized
  | ManifestNormalized
  | CanvasNormalized
  // ... existing ...
  | TimelineNormalized   // or any
  | SceneNormalized      // or any
  | QuantityNormalized   // or any
  | TransformNormalized  // or any
  ;
```

#### 2.3 Update `RefToNormalized` and `RefToFull` conditional types (`src/vault/types.ts`)

Add branches for new types:
```typescript
// In RefToNormalized:
: Ref['type'] extends 'Timeline' ? any
: Ref['type'] extends 'Scene' ? any
: Ref['type'] extends 'Quantity' ? any
: Ref['type'] extends 'Transform' ? any
```

#### 2.4 Update `getDefaultEntities()` (`src/vault/utility/get-default-entities.ts`)

```typescript
export function getDefaultEntities(): Entities {
  return {
    Collection: {},
    Manifest: {},
    Canvas: {},
    AnnotationPage: {},
    AnnotationCollection: {},
    Annotation: {},
    ContentResource: {},
    Range: {},
    Service: {},
    Selector: {},
    Agent: {},
    // NEW
    Timeline: {},
    Scene: {},
    Quantity: {},
    Transform: {},
  };
}
```

#### 2.5 Update `resolveType()` (`src/vault/utility/resolve-type.ts`)

```typescript
export function resolveType(type: string): keyof Entities {
  switch (type) {
    // Existing content resource mappings
    case 'Image':
    case 'Video':
    case 'Sound':
    case 'Audio':       // P4 alias
    case 'Model':       // P4 new
    case 'Dataset':     // P4 (also in late P3)
    case 'Text':
    case 'TextualBody':
    case 'Composite':
    case 'List':
    case 'Independents':
    case 'Audience':
    case 'Choice':
    // P4 scene components (stored as content resources)
    case 'PerspectiveCamera':
    case 'OrthographicCamera':
    case 'AmbientLight':
    case 'DirectionalLight':
    case 'PointLight':
    case 'SpotLight':
    case 'AmbientAudio':
    case 'PointAudio':
    case 'SpotAudio':
      return 'ContentResource';

    // Service types
    case 'ImageService1':
    case 'ImageService2':
    case 'ImageService3':
      return 'Service';

    // P4 new container types
    case 'Timeline':
      return 'Timeline';
    case 'Scene':
      return 'Scene';

    // P4 new types
    case 'Quantity':
      return 'Quantity';

    // P4 transforms
    case 'Transform':
    case 'RotateTransform':
    case 'ScaleTransform':
    case 'TranslateTransform':
      return 'Transform';

    // Selector types
    case 'PointSelector':
    case 'WktSelector':
    case 'AnimationSelector':
    case 'FragmentSelector':
    case 'ImageApiSelector':
    case 'SvgSelector':
      return 'Selector';

    default:
      return type as any;
  }
}
```

#### 2.6 Update `entities-reducer.ts`

The `IMPORT_ENTITIES` case already iterates over all keys, so it will automatically handle new stores. The `updateField` helper similarly works generically. No structural changes needed — just ensure the TypeScript types align.

#### 2.7 Update `is-reference-list.ts`

Uses `CompatibleStore['entities']` which is generic — should work with new stores automatically after type update.

#### 2.8 Verification

```bash
pnpm run typecheck
pnpm run test
```

All existing tests should pass unchanged since new stores are empty by default and nothing references them yet.

---

## Phase 3: Normalizer Swap (P3 → P4)

### Goal
Switch Vault's internal normalizer from P3 `normalize()` to P4 `normalize()`, so all incoming resources (P2, P3, P4) are upgraded to P4 shape before storage.

### Tasks

#### 3.1 Update `action-list-from-resource.ts`

This is the **critical change point**. Currently:

```typescript
import { normalize } from '@iiif/parser';
```

This imports P3's `normalize`. Change to:

```typescript
import { normalize } from '@iiif/parser/presentation-4';
```

The P4 `normalize()` already:
1. Detects source version (P2/P3/P4)
2. Upgrades through P2→P3→P4
3. Returns `Presentation4Entities` with all new store types

The return shape is:
```typescript
{
  entities: Presentation4Entities;  // Has Timeline, Scene, Quantity, Transform
  mapping: Record<string, string>;
  resource: { id: string; type: string };
  diagnostics: ValidationIssue[];
  sourceVersion: 2 | 3 | 4 | 'unknown';
}
```

The `entities` keys match our expanded `Entities` type (after Phase 2), so `importEntities({ entities })` should work.

#### 3.2 Entity Shape Compatibility

**Critical concern**: The P4 normalizer stores entities with a looser shape (`NormalizedEntityV4 = { id?, type?, [key: string]: unknown }`) compared to the strongly-typed P3 normalized types (e.g., `CanvasNormalized` with explicit `width`, `height`, `items` fields).

However, the actual data stored will have those fields — they're just not typed. The P4 normalizer preserves all fields from the input, and the upgrade from P3 ensures fields like `width`/`height` remain.

**Key shape changes that DO happen in the P4 upgrade**:
- `Annotation.motivation`: already an array in P3 normalize → stays array
- `Annotation.target`: already expanded in P3 → stays expanded, now always array of objects
- `Annotation.body`: already expanded → now always array
- `placeholderCanvas` → `placeholderContainer` (renamed)
- `accompanyingCanvas` → `accompanyingContainer` (renamed)

**What the P4 normalizer does that P3 didn't**:
- Canvases that only have `duration` (no width/height) may be stored as `Timeline`
  - **But wait** — the P4 *upgrade* keeps the type as-is from the P3 output. It only changes to Timeline/Scene if the input explicitly says so, or if the original P4 input had those types.
  - P3 manifests upgraded to P4 will keep `type: "Canvas"` on all canvases.

#### 3.3 Mapping Compatibility

The P4 `mapping` maps ids to store names like `"Canvas"`, `"Timeline"`, `"Scene"`, etc. Our `resolveType()` (updated in Phase 2) will correctly map these back when `Vault.get()` looks up entities.

#### 3.4 Serializer Import Updates (`src/vault/vault.ts`)

Currently:
```typescript
import {
  serialize,
  SerializeConfig,
  serializeConfigPresentation2,
  serializeConfigPresentation3,
} from '@iiif/parser';
```

Change to import P4's serializer infrastructure:
```typescript
import {
  serialize,
  type SerializeConfig,
  serializeConfigPresentation3,
  serializeConfigPresentation4,
} from '@iiif/parser/presentation-4';
import {
  serializeConfigPresentation2,
} from '@iiif/parser';
```

> **Note**: P4's `serializeConfigPresentation3` handles downgrading from P4 store back to P3 JSON (maps `placeholderContainer` back to `placeholderCanvas`, converts Timelines to Canvases, etc.). This is different from the P3 serializer's `serializeConfigPresentation3`.

> **Breaking concern**: P4's `serializeConfigPresentation3` will throw on Scene containers (unsupported in P3). This is correct behavior — you can't downgrade a 3D scene to P3.

#### 3.5 Update `resolve-if-exists.ts`

Currently imports `frameResource`, `HAS_PART`, `PART_OF` from `@iiif/parser`. Need to check if P4 normalizer still uses the same framing mechanism.

**Finding**: The P4 normalizer does NOT currently use `HAS_PART`/`PART_OF` framing. This is a **parser gap** — see [Section 11](#potential-parser-changes-needed). For now, these utilities can remain imported from `@iiif/parser` (P3 export) since `HAS_PART` is a constant string and `frameResource` is a utility function that works on any object shape.

#### 3.6 Verification

```bash
pnpm run typecheck
pnpm run test
```

Existing tests loading P2/P3 manifests should still pass because the P4 normalizer handles them. The entities stored will have a slightly different shape (P4 conventions) but the structural fields (`items`, `label`, etc.) are preserved.

---

## Phase 4: Canvas Compatibility Layer

### Goal
Ensure `vault.get({id: '...', type: 'Canvas'})` still works even when a resource has been stored as `Timeline` or `Scene` in the P4 store.

### Tasks

#### 4.1 Update `Vault.get()` Container Fallback

In `src/vault/vault.ts`, the `get()` method resolves the entity store via type. Add fallback logic:

```typescript
// After looking up entities[_type][_id] and not finding it:
const CONTAINER_TYPES = ['Canvas', 'Timeline', 'Scene'] as const;

// If the requested type is a container type but wasn't found,
// search other container stores
if (CONTAINER_TYPES.includes(_type) && !found) {
  for (const containerType of CONTAINER_TYPES) {
    if (containerType === _type) continue;
    const altEntities = (state.iiif.entities as any)[containerType];
    if (altEntities && altEntities[_id]) {
      found = altEntities[_id];
      break;
    }
  }
}
```

This ensures:
- `get({id, type: 'Canvas'})` finds Timeline/Scene resources
- `get({id, type: 'Timeline'})` finds Canvas resources (forward compat)
- `get({id, type: 'Scene'})` finds Canvas resources

#### 4.2 Update Mapping Fallback

Also check the `mapping` table. If someone passes a bare ID string:
```typescript
if (typeof reference === 'string') {
  const _type = resolveType(type ? type : state.iiif.mapping[reference]);
  // If mapping says "Timeline" but user asked for "Canvas", that's fine
}
```

This already works — `resolveType` maps `"Timeline"` to `"Timeline"`, and the mapping correctly tells us where it's stored. The fallback in 4.1 handles the case where someone explicitly passes `type: 'Canvas'` but it's stored as `Timeline`.

#### 4.3 Property Compatibility Aliases

For backwards compatibility, when returning entities that used to be Canvases, consider adding computed properties:

```typescript
// In Vault or a utility, when returning a container:
// If the entity has placeholderContainer but no placeholderCanvas:
if (entity.placeholderContainer && !entity.placeholderCanvas) {
  entity.placeholderCanvas = entity.placeholderContainer;
}
if (entity.accompanyingContainer && !entity.accompanyingCanvas) {
  entity.accompanyingCanvas = entity.accompanyingContainer;
}
```

**Decision point**: Should this be done at read time (in `get()`) or at import time (in the entities reducer)? 

**Recommendation**: Do it at import time in the entities reducer, during `IMPORT_ENTITIES`. This way the compatibility properties are always present and we don't add overhead to every `get()` call. Add both the old and new property names to Container entities.

#### 4.4 Verification

Write specific tests:
```typescript
test('get with type Canvas finds Timeline resources', () => { ... });
test('get with type Canvas finds Scene resources', () => { ... });
test('placeholderCanvas alias works on P4 containers', () => { ... });
```

---

## Phase 5: Serialization & Export

### Goal
Add `toPresentation4()` method and ensure existing `toPresentation2()`/`toPresentation3()` still work correctly with the P4 internal store.

### Tasks

#### 5.1 Add `toPresentation4()` to Vault

```typescript
// In src/vault/vault.ts
toPresentation4<Return>(entity: Reference<keyof Entities>) {
  return this.serialize<Return>(entity, serializeConfigPresentation4);
}
```

#### 5.2 Update `toPresentation3()` 

Currently uses `serializeConfigPresentation3` from `@iiif/parser` (P3). After Phase 3, it should use the P4 serializer's `serializeConfigPresentation3` which correctly downgrades from P4 store format:

```typescript
// This now uses P4's downgrade serializer
toPresentation3<Return>(entity: Reference<keyof Entities>) {
  return this.serialize<Return>(entity, serializeConfigPresentation3);
}
```

#### 5.3 Update `toPresentation2()`

The P3 serializer's `serializeConfigPresentation2` was designed to work with a P3 store. Since we now have a P4 store, we need a two-step approach:

**Option A**: Serialize P4 → P3 → P2 (two passes)
**Option B**: Create a P4 → P2 serializer config

**Recommendation**: Option A for simplicity:
```typescript
toPresentation2<Return>(entity: Reference<keyof Entities>) {
  // First serialize to P3 JSON, then normalize as P3, then serialize to P2
  // ... or use the P3 serializeConfigPresentation2 if it works with the P4 store shape
}
```

**Actually**: The P4 store shape is close enough to the P3 store shape that `serializeConfigPresentation2` from P3 may just work, since it only reads standard properties. Test this. If it fails on new container types, fall back to Option A.

**Simplest approach**: Keep importing `serializeConfigPresentation2` from `@iiif/parser` (the P3 export). If the serializer encounters a Timeline, it will likely skip or error — which is acceptable since Timelines don't exist in P2.

#### 5.4 Update `serialize()` Method

The `serialize()` method's `SerializeConfig` type comes from the P4 serializer module which has a more generic `{ [type: string]: Serializer }` shape. This is actually more flexible than the P3 version which was keyed to specific types. Ensure the Vault's `serialize()` call works with both.

#### 5.5 Add exports to `src/index.ts`

No changes needed — the Vault class already exports `toPresentation3`, `toPresentation2`, and now `toPresentation4`.

#### 5.6 Verification

```bash
pnpm run typecheck
pnpm run test
```

Write tests for round-trip:
- Load P3 manifest → toPresentation4() → valid P4 JSON
- Load P3 manifest → toPresentation3() → matches original (modulo normalization)
- Load P4 manifest → toPresentation3() → valid P3 JSON
- Load P4 manifest → toPresentation4() → matches original

---

## Phase 6: Fixtures & Smoke Tests

### Goal
Create comprehensive test fixtures and smoke tests for P4 vault operation.

### Tasks

#### 6.1 Copy P4 Fixtures from Parser

Copy the parser's P4 fixtures into iiif-helpers:

```
parser/fixtures/cookbook-v4/*.json      → iiif-helpers/fixtures/presentation-4/cookbook/
parser/fixtures/presentation-4/*.json  → iiif-helpers/fixtures/presentation-4/scenes/
```

These are "native P4" fixtures with:
- Scene containers
- Model content resources  
- 3D annotations
- Cameras, lights, transforms

#### 6.2 Generate P4 Fixtures by Upgrading Existing P3 Fixtures

Create a script `scripts/generate-p4-fixtures.mjs`:

```javascript
import { upgradeToPresentation4 } from '@iiif/parser/presentation-4';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const fixtureDir = 'fixtures/cookbook';
const outputDir = 'fixtures/presentation-4/upgraded-from-p3';

const files = readdirSync(fixtureDir).filter(f => f.endsWith('.json'));
for (const file of files) {
  const json = JSON.parse(readFileSync(join(fixtureDir, file), 'utf8'));
  const upgraded = upgradeToPresentation4(json);
  writeFileSync(join(outputDir, file), JSON.stringify(upgraded, null, 2));
}
```

This gives us a set of "P3 manifests upgraded to P4" to test the upgrade path.

#### 6.3 Keep Existing Fixtures

All existing fixtures in `fixtures/presentation-2/`, `fixtures/presentation-3/`, `fixtures/cookbook/` stay as-is. Tests should load them through the vault and verify they work.

#### 6.4 New Fixture Directory Structure

```
fixtures/
├── annotations/          # existing
├── cookbook/              # existing P3 cookbook fixtures
├── exhibitions/          # existing
├── presentation-2/       # existing P2 fixtures
├── presentation-3/       # existing P3 fixtures (has-part.json etc.)
├── presentation-4/       # NEW
│   ├── cookbook/          # Native P4 cookbook (from parser)
│   ├── scenes/           # Native P4 scene fixtures (from parser)
│   └── upgraded-from-p3/ # P3 fixtures upgraded to P4 shape
├── search1/              # existing
└── thumbnails/           # existing
```

#### 6.5 Write Smoke Tests

Create `__tests__/vault/vault-p4.test.ts`:

```typescript
describe('Vault P4 support', () => {
  // Category 1: Loading native P4 manifests
  describe('native P4 fixtures', () => {
    test.each(p4CookbookFixtures)('loads %s', async (name, json) => {
      const vault = new Vault();
      const manifest = vault.loadSync(json.id, json);
      expect(manifest).toBeTruthy();
      expect(manifest.id).toBe(json.id);
      expect(manifest.type).toBe('Manifest');
    });
  });

  // Category 2: Loading P3 manifests (backwards compat)
  describe('P3 fixtures still work', () => {
    test.each(p3CookbookFixtures)('loads %s', async (name, json) => {
      const vault = new Vault();
      const manifest = vault.loadSync(json.id, json);
      expect(manifest).toBeTruthy();
      expect(manifest.items.length).toBeGreaterThan(0);
    });
  });

  // Category 3: Loading P2 manifests (backwards compat)
  describe('P2 fixtures still work', () => {
    test('loads NLS manifest', () => {
      const vault = new Vault();
      const manifest = vault.loadSync(nlsManifest['@id'], nlsManifest);
      expect(manifest).toBeTruthy();
    });
  });

  // Category 4: Canvas compatibility
  describe('Canvas compatibility', () => {
    test('get with type Canvas finds Timeline', () => { ... });
    test('get with type Canvas finds Scene', () => { ... });
    test('P3 canvas is still type Canvas after P4 upgrade', () => { ... });
  });

  // Category 5: Serialization round-trips
  describe('serialization', () => {
    test('toPresentation4 from P3 input', () => { ... });
    test('toPresentation3 from P4 input', () => { ... });
    test('toPresentation4 round-trip', () => { ... });
  });

  // Category 6: New container types
  describe('new P4 containers', () => {
    test('Timeline entities are stored correctly', () => { ... });
    test('Scene entities are stored correctly', () => { ... });
    test('Quantity entities are stored correctly', () => { ... });
    test('Transform entities are stored correctly', () => { ... });
  });

  // Category 7: Scene/3D fixtures
  describe('3D/Scene support', () => {
    test('loads manifest with Scene container', () => { ... });
    test('loads manifest with Model content resource', () => { ... });
    test('loads manifest with camera and lights', () => { ... });
  });
});
```

#### 6.6 Verify Existing Tests Still Pass

```bash
pnpm run test
```

**ALL existing tests must pass unchanged.** This is the primary compatibility gate.

---

## Phase 7: Type Package Removal

### Goal
Fully remove `@iiif/presentation-2`, `@iiif/presentation-3`, and `@iiif/presentation-3-normalized` packages, replacing all type imports with `@iiif/parser` exports.

### Tasks

This was partially covered in Phase 1. The remaining work:

#### 7.1 Audit All Type Imports

Run:
```bash
grep -r "@iiif/presentation-" src/ --include="*.ts" | grep -v "@iiif/parser"
```

Every hit must be remapped.

#### 7.2 Specific Type Mappings

| Old Type | New Location |
|---|---|
| `Canvas` | `@iiif/parser/presentation-3/types` |
| `Manifest` | `@iiif/parser/presentation-3/types` |
| `Collection` | `@iiif/parser/presentation-3/types` |
| `Annotation` | `@iiif/parser/presentation-3/types` |
| `AnnotationPage` | `@iiif/parser/presentation-3/types` |
| `AnnotationCollection` | `@iiif/parser/presentation-3/types` |
| `Range` | `@iiif/parser/presentation-3/types` |
| `ContentResource` | `@iiif/parser/presentation-3/types` |
| `Reference` | `@iiif/parser/presentation-3/types` |
| `SpecificResource` | `@iiif/parser/presentation-3/types` |
| `InternationalString` | `@iiif/parser/presentation-3/types` |
| `Service` | `@iiif/parser/presentation-3/types` |
| `Selector` | `@iiif/parser/presentation-3/types` |
| `ImageService` | `@iiif/parser/presentation-3/types` |
| `ImageService2` | `@iiif/parser/presentation-3/types` |
| `ImageService3` | `@iiif/parser/presentation-3/types` |
| `ResourceProvider` | `@iiif/parser/presentation-3/types` |
| `CanvasNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `ManifestNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `CollectionNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `AnnotationNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `AnnotationPageNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `RangeNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `ServiceNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `ResourceProviderNormalized` | `@iiif/parser/presentation-3-normalized/types` |
| `DescriptiveNormalized` | `@iiif/parser/presentation-3-normalized/types` |

#### 7.3 Remove Packages

```bash
pnpm remove @iiif/presentation-2 @iiif/presentation-3 @iiif/presentation-3-normalized
```

Remove from `resolutions` and `overrides` in `package.json`.

#### 7.4 Verification

```bash
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run lint
```

---

## Testing Strategy

### Test Pyramid

```
                    ┌─────────────┐
                    │  E2E/Smoke  │  Vault loads all fixture types,
                    │   Tests     │  serialize round-trips work
                    ├─────────────┤
                    │ Integration │  Vault + store + normalizer
                    │   Tests     │  together, Canvas compat layer
                    ├─────────────┤
                    │    Unit     │  resolveType, getDefaultEntities,
                    │   Tests     │  entities-reducer with new types
                    └─────────────┘
```

### Test Files

| File | What It Tests |
|---|---|
| `__tests__/vault/vault-p4.test.ts` | **NEW** - P4 loading, new containers, Canvas compat |
| `__tests__/vault/vault-fixtures.test.ts` | Existing - must still pass |
| `__tests__/vault/vault-functions.test.ts` | Existing - must still pass |
| `__tests__/vault/store.test.ts` | Existing - must still pass |
| `__tests__/vault/objects.test.ts` | Existing - must still pass |
| `__tests__/vault/global-vault.test.ts` | Existing - must still pass |
| All other test files | Must still pass |

### Specific Test Scenarios for P4

1. **Load P3 cookbook manifest → verify Canvas items are still Canvas type**
2. **Load P4 cookbook manifest with Timeline → verify Timeline in Timeline store**
3. **Load P4 manifest with Scene → verify Scene in Scene store**
4. **`get({id, type:'Canvas'})` on a Timeline → returns the Timeline**
5. **`get({id, type:'Canvas'})` on a Canvas → returns the Canvas (no regression)**
6. **Load P2 manifest → verify full upgrade path works**
7. **`toPresentation4()` produces valid P4 JSON with correct @context**
8. **`toPresentation3()` from P4-normalized store produces valid P3 JSON**
9. **`toPresentation3()` throws on Scene (unsupported in P3)**
10. **`placeholderCanvas` compat alias works**
11. **Annotation target/body arrays work correctly**
12. **Entity actions (add/remove/modify) work on new store types**
13. **Metadata actions work on new store types**

---

## Potential Parser Changes Needed

These are areas where the parser may need updates to fully support the iiif-helpers migration:

### 11.1 HAS_PART / Framing in P4 Normalizer

**Issue**: The P3 normalizer supports `iiif-parser:hasPart` framing for resources that appear in multiple contexts with different metadata. The P4 normalizer does not implement this.

**Impact**: Manifests with framed resources (e.g., a Canvas appearing in multiple Ranges with different labels) may lose context-specific metadata.

**Recommendation**: Port the `HAS_PART`/`PART_OF` framing logic from P3 normalizer to P4. This is needed for `resolve-if-exists.ts` and `Vault.get()` which check for `HAS_PART`.

**Workaround**: If not ported, `Vault.get()` will still work — it just won't apply framing. The `HAS_PART` check in `get()` will be a no-op since no entities will have that property.

### 11.2 P4 `serializeConfigPresentation2`

**Issue**: There is no P4 → P2 serializer config in the parser.

**Impact**: `Vault.toPresentation2()` may not work correctly with P4-shaped stores.

**Recommendation**: Either:
- Create a `serializeConfigPresentation2` in `src/presentation-4/` in the parser
- Or do a two-pass: serialize P4→P3 then P3→P2 in iiif-helpers

### 11.3 Empty Types for P4

**Issue**: The P4 normalizer has `emptyCanvas`, `emptyManifest`, etc. but these are used differently than P3's. Vault's `hydrate()` method may need access to empty type templates.

**Impact**: Low — `hydrate()` uses `skipSelfReturn: false` which returns the reference itself as fallback.

### 11.4 `CompatibleStore` Type Alignment

**Issue**: P3's `CompatibleStore` type and P4's are slightly different. P3's is strongly typed per entity type, P4's uses `{ [type: string]: { [id: string]: NormalizedEntity } }`.

**Impact**: The P4 `serialize()` function accepts the broader type, so Vault's state should be compatible. Verify with type checking.

### 11.5 `placeholderContainer` / `accompanyingContainer` in P3 Downgrade

**Issue**: When serializing P4 back to P3, the P4 serializer's `serializeConfigPresentation3` correctly maps `placeholderContainer` → `placeholderCanvas`. But it throws if the container type is not Canvas. Need to ensure this is well-tested.

**Impact**: Mostly correct. Edge case: a P3 manifest with `placeholderCanvas` that gets upgraded to P4 (becoming `placeholderContainer`) and then serialized back to P3 — the round-trip should preserve `placeholderCanvas`.

---

## Rollout Checklist

### Pre-merge
- [ ] All Phase 1-7 tasks complete
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run test` passes (ALL existing + new tests)
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] `pkg-tests` scripts pass after build
- [ ] No unintended export/API surface changes
- [ ] Backwards compatibility verified for P2/P3 inputs
- [ ] Canvas compat layer tested
- [ ] `toPresentation4()` tested
- [ ] `toPresentation3()` tested with P4 store
- [ ] New P4 fixtures in place
- [ ] Smoke tests for all fixture categories pass

### Post-merge
- [ ] Publish pre-release for downstream testing
- [ ] Test with known consumers (Clover, Manifest Editor, etc.)
- [ ] Verify no runtime regressions in browser
- [ ] Document migration for downstream users (should be: "just update")

---

## Execution Order Summary

```
Phase 1: Dependency & Type Migration          ← Do first, foundation
  ↓
Phase 2: Store & Entity Expansion             ← Additive, safe
  ↓
Phase 3: Normalizer Swap (P3 → P4)           ← Core change, most risk
  ↓
Phase 4: Canvas Compatibility Layer           ← Safety net for Phase 3
  ↓
Phase 5: Serialization & Export               ← New features
  ↓
Phase 6: Fixtures & Smoke Tests              ← Validation (start writing early)
  ↓
Phase 7: Type Package Removal                ← Cleanup (can merge with Phase 1)
```

**Estimated effort**: Phases 1-2 can be done together. Phase 3 is the riskiest and should be done carefully with constant test runs. Phase 4 is small but critical. Phases 5-6 add value. Phase 7 is cleanup.

**Recommended approach**: Do Phases 1+2+7 together (type migration), then 3+4 together (core swap), then 5+6 (features + tests). Write tests from Phase 6 early to validate each phase.
