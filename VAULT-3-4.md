# Vault 3/4 Compatibility Plan

## Goals

1. Restore backwards compatibility for all existing projects using `Vault` today.
2. Keep `Vault` as the v3 implementation and introduce `Vault4`.
3. Introduce a default `VaultAuto` (exported as `Vault`) that:
   - starts in v3 mode,
   - can opt-in to v4 switching,
   - only switches when v4-only content (Scene) is detected.
4. Prove parity with exhaustive fixture-based tests and snapshots before enabling any default behavior changes.

## Non-goals (for this phase)

1. Making v4 the default runtime mode.
2. Removing v3 action/property compatibility paths.
3. Large refactors of helper APIs beyond compatibility shims.

## Target API

### Classes

1. `Vault`
   - Uses Presentation 3 normalization/serialization path.
   - Keeps current v3-compatible behavior as baseline.
2. `Vault4`
   - Uses Presentation 4 normalization/serialization path.
   - Accepts v3 inputs by upgrading/parsing into v4-normalized state.
3. `VaultAuto`
   - Starts with an internal `Vault` instance.
   - Optionally enables automatic switching to `Vault4`.
   - Exposes `v4` accessor for typed access when app code knows Scene is present.

### Construction options

Proposed options for `VaultAuto`:

1. `enablePresentation4?: boolean` (default: `false`)
   - Backwards-compatible default.
   - When `false`, v4 resources containing Scene fail with a clear error.
2. `switchOnScene?: boolean` (default: `true`)
   - Controls Scene-triggered migration when `enablePresentation4` is `true`.
3. `onVersionSwitch?: (from: 3, to: 4, context: { triggerId: string }) => void`
   - Optional event hook for application observability.

### Accessors

`VaultAuto` should expose:

1. `isPresentation4(): boolean`
2. `getVersion(): 3 | 4`
3. `v4`
   - `undefined` before switch.
   - typed `Vault4` after switch.
   - supports usage pattern: `if (hasScene) { vault.v4?.get(...) }`

## Behavior contract

1. Existing projects importing `Vault` should behave exactly as now for v2/v3 resources.
2. No automatic switch without explicit opt-in (`enablePresentation4`).
3. Scene presence is the switching trigger in `VaultAuto`.
4. `Vault4` loading v3 resources must preserve output compatibility for existing helpers and workflows.
5. `Vault4` methods must be type-safe across the existing vault API surface.
6. Legacy property aliases (e.g. `accompanyingCanvas` vs `accompanyingContainer`) must be mirrored in normalized entities and action-level mutations.

## Migration strategy (VaultAuto internal switch)

## Phase A: Safe and simple migration path

1. Keep a journal of loaded source payloads in `VaultAuto`:
   - `{ requestedId, responseJson }[]`
2. On switch trigger:
   - instantiate `Vault4`,
   - replay journal through `Vault4.loadSync` / `Vault4.load`,
   - swap active implementation pointer from `Vault` to `Vault4`,
   - emit version-switch event.
3. Keep this replay strategy first; optimize later only if needed.

Rationale: replay is deterministic, low risk, and avoids fragile in-place state transforms.

## Phase B: Optional optimization (later)

1. Evaluate direct store migration if replay cost becomes significant.
2. Only attempt after parity tests are stable and comprehensive.

## Helpers compatibility plan

1. Audit current helpers for strict `presentation-3-normalized` assumptions.
2. Update shared helpers to use union-compatible normalized references where possible.
3. Keep shared entrypoints v3/v4-compatible.
4. Add v4-only helper additions under a dedicated subpath (e.g. `iiif-helpers/v4/*`).
5. Do not break existing helper signatures unless absolutely required.

## Testing strategy (regression gate)

Snapshot-driven parity testing across **all fixtures**.

### Test groups

1. `Vault` baseline snapshots:
   - load fixture -> capture resolved top-level object,
   - capture normalized store summary (entities/mapping shape),
   - capture selected helper outputs.
2. `Vault4` compatibility snapshots for v3 fixtures:
   - same fixture set and same snapshot shape as `Vault`.
3. Direct parity assertions (`Vault` vs `Vault4`) for v2/v3 fixtures:
   - deep equality on compatibility projections,
   - allowed-difference list for known renamed fields.
4. `VaultAuto` behavior:
   - default mode remains v3 behavior,
   - opt-in off + Scene fixture -> explicit failure path,
   - opt-in on + Scene fixture -> switches to v4,
   - post-switch `vault.v4` accessor typed and usable.

### Fixture matrix (must include)

1. `fixtures/presentation-2/**/*`
2. `fixtures/presentation-3/**/*`
3. `fixtures/cookbook/**/*` (v3 cookbook)
4. `iiif-helpers/fixtures/**/*` relevant helper fixtures
5. `fixtures/presentation-4/**/*` for switch + v4-only expectations

### Snapshot shape guidance

To reduce noise, snapshot normalized projections rather than entire internal state blobs:

1. Root resource `{ id, type, item counts }`
2. Entity counts by type
3. Canonicalized key properties per type (including alias-mirrored fields)
4. Helper result snapshots for representative helpers (thumbnail, ranges, i18n, etc.)

## Implementation phases

1. `Phase 0: Reset`
   - Undo current partial Vault migration changes.
   - Re-establish green baseline on existing tests.
2. `Phase 1: Split classes`
   - Keep `Vault` as the v3 class.
   - Introduce `Vault4` as a separate class.
3. `Phase 2: Introduce VaultAuto`
   - Implement dual-engine wrapper and replay migration.
   - Add version accessors and `v4` accessor.
4. `Phase 3: Alias/mutation compatibility`
   - Implement field alias mirroring in normalization projections and actions.
   - Add targeted tests for alias writes/reads.
5. `Phase 4: Vault4 type-safety hardening`
   - Audit `Vault4` method signatures (`get`, `hydrate`, `load*`, `serialize*`, `getObject`, `loadObject`, `subscribe`, pagination/meta helpers).
   - Remove `any`-based fallbacks where avoidable and align return types with v3 compatibility contracts.
   - Add dedicated type-focused tests (compile-time assertions) for common usage paths.
6. `Phase 5: Fixture parity suite`
   - Add full snapshot + parity matrix.
   - Gate with CI.
7. `Phase 6: Helper dual-compat`
   - Update helper internals for v3/v4 compatibility.
   - Add `v4` helper subpath for v4-specific functionality.

## Exit criteria

1. Existing v2/v3 integration tests pass unchanged.
2. New parity suite passes for all selected fixtures.
3. `VaultAuto` default path shows zero behavior regressions for v2/v3.
4. `VaultAuto` opt-in path successfully switches on Scene and exposes typed `vault.v4`.
5. Build, typecheck, tests, and package-load checks all pass.

## Open decisions to approve before implementation

1. Option names:
   - keep `enablePresentation4` / `switchOnScene`, or rename. (A: keep)
2. Scene detection point:
   - detect from raw payload pre-normalization vs post-normalization signal. (A: pre)
3. Default behavior when Scene is loaded with opt-in disabled:
   - throw error (recommended) vs ignore. (throw)
4. `v4` accessor shape:
   - property (`vault.v4`) vs method (`vault.getV4()`). (A: vault.v4)
