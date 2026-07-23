import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import type { PaginationPageNormalized, PaginationState } from '../../src/vault/types';
import { Vault4 } from '../../src/vault/vault4';

const manifestId = 'https://example.org/iiif/profile/manifest';
const timelineId = 'https://example.org/iiif/profile/timeline';
const manifest = {
  '@context': 'http://iiif.io/api/presentation/4/context.json',
  id: manifestId,
  type: 'Manifest',
  label: { en: ['Presentation 4 profile'] },
  items: [{ id: timelineId, type: 'Timeline', duration: 10, items: [] }],
};

describe('Vault4 fixed profile', () => {
  test('uses its custom fetcher and passes itself to subscriptions', async () => {
    const customFetcher = vi.fn(async () => manifest);
    const vault = new Vault4({ customFetcher });
    let callbackVault: Vault4 | undefined;

    const unsubscribe = vault.subscribe(
      (state) => state.iiif.mapping[manifestId],
      (_mapping, activeVault) => {
        expectTypeOf(activeVault).toEqualTypeOf<Vault4>();
        callbackVault = activeVault;
      },
      true
    );

    const loaded = await vault.loadManifest(manifestId);
    unsubscribe();

    expect(customFetcher).toHaveBeenCalledWith(manifestId, {});
    expect(loaded?.items[0]).toMatchObject({ id: timelineId, type: 'Timeline' });
    expect(callbackVault).toBe(vault);
  });

  test('keeps the Presentation 4 pagination return type', () => {
    expectTypeOf(new Vault4().loadNextPage).returns.toEqualTypeOf<
      Promise<[PaginationState | null, PaginationPageNormalized | null]>
    >();
  });
});
