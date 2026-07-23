import { describe, expect, test } from 'vitest';
import { Vault } from '../../src/vault/vault';
import { Vault4 } from '../../src/vault/vault4';

describe('Vault4 load reports', () => {
  test('preserves the parser source version and diagnostics', () => {
    const manifestId = 'https://example.org/iiif/manifest/diagnostics';
    const vault = new Vault4();
    vault.loadManifestSync(manifestId, {
      '@context': 'http://iiif.io/api/presentation/4/context.json',
      id: manifestId,
      type: 'Manifest',
      label: { en: ['Diagnostics'] },
      items: [{ type: 'Canvas', height: 1, width: 1, items: [] }],
    });

    expect(vault.getLoadReport(manifestId)).toMatchObject({
      sourceVersion: 4,
      diagnostics: [
        {
          code: 'minted-id',
          severity: 'warning',
          path: '$.items[0]',
          resourceType: 'Canvas',
        },
      ],
    });
  });

  test('records source version for the default compatibility Vault', () => {
    const manifestId = 'https://example.org/iiif/manifest/timeline-compatibility';
    const vault = new Vault();
    vault.loadManifestSync(manifestId, {
      '@context': 'http://iiif.io/api/presentation/4/context.json',
      id: manifestId,
      type: 'Manifest',
      label: { en: ['Timeline compatibility'] },
      items: [
        {
          id: 'https://example.org/iiif/timeline/1',
          type: 'Timeline',
          duration: 10,
          items: [],
        },
      ],
    });

    expect(vault.getLoadReport(manifestId)).toEqual({
      sourceVersion: 4,
      diagnostics: [],
    });
  });
});
