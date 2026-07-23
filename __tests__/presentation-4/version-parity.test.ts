import { describe, expect, test } from 'vitest';
import { getValue } from '../../src/i18n';
import { createSequenceHelper } from '../../src/sequences';
import { Vault } from '../../src/vault/vault';
import { Vault4 } from '../../src/vault/vault4';

const manifestId = 'https://example.org/parity/manifest';
const canvasId = 'https://example.org/parity/canvas';

const manifests = [
  {
    '@context': 'http://iiif.io/api/presentation/2/context.json',
    '@id': manifestId,
    '@type': 'sc:Manifest',
    label: { '@language': 'en', '@value': 'Equivalent manifest' },
    sequences: [
      {
        '@id': `${manifestId}/sequence`,
        '@type': 'sc:Sequence',
        canvases: [
          {
            '@id': canvasId,
            '@type': 'sc:Canvas',
            label: { '@language': 'en', '@value': 'Equivalent canvas' },
            width: 1000,
            height: 800,
            images: [],
          },
        ],
      },
    ],
  },
  {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: manifestId,
    type: 'Manifest',
    label: { en: ['Equivalent manifest'] },
    items: [
      {
        id: canvasId,
        type: 'Canvas',
        label: { en: ['Equivalent canvas'] },
        width: 1000,
        height: 800,
        items: [],
      },
    ],
  },
  {
    '@context': 'http://iiif.io/api/presentation/4/context.json',
    id: manifestId,
    type: 'Manifest',
    label: { en: ['Equivalent manifest'] },
    items: [
      {
        id: canvasId,
        type: 'Canvas',
        label: { en: ['Equivalent canvas'] },
        width: 1000,
        height: 800,
        items: [],
      },
    ],
  },
] as const;

function domainResult(VaultClass: typeof Vault | typeof Vault4, input: unknown) {
  const vault = new VaultClass();
  const manifest = vault.loadManifestSync(manifestId, structuredClone(input))!;
  const [sequence] = createSequenceHelper(vault).getManifestSequence(manifest);
  return {
    label: getValue(manifest.label, { language: 'en' }),
    sequence,
  };
}

describe('Presentation 2, 3, and 4 semantic parity', () => {
  test.each([
    ['Presentation 3 Vault', Vault],
    ['Presentation 4 Vault', Vault4],
  ])('%s exposes the same shared-helper result for equivalent resources', (_name, VaultClass) => {
    expect(manifests.map((manifest) => domainResult(VaultClass, manifest))).toEqual([
      {
        label: 'Equivalent manifest',
        sequence: [{ id: canvasId, type: 'Canvas' }],
      },
      {
        label: 'Equivalent manifest',
        sequence: [{ id: canvasId, type: 'Canvas' }],
      },
      {
        label: 'Equivalent manifest',
        sequence: [{ id: canvasId, type: 'Canvas' }],
      },
    ]);
  });
});
