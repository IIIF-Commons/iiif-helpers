import assert from 'node:assert/strict';

const helpersPackage = '@iiif/helpers';
const { Vault } = await import(`${helpersPackage}/vault`);
const { Vault4 } = await import(`${helpersPackage}/vault-4`);

const manifestId = 'https://example.org/iiif/manifest';
const containerId = 'https://example.org/iiif/container/1';
const manifest = {
  '@context': 'http://iiif.io/api/presentation/4/context.json',
  id: manifestId,
  type: 'Manifest',
  label: { en: ['Presentation 4 timeline'] },
  items: [{ id: containerId, type: 'Timeline', duration: 30, items: [] }],
};

const vault = new Vault();
const projectedManifest = vault.loadManifestSync(manifestId, manifest);
assert(projectedManifest);
assert.equal(vault.get(projectedManifest.items[0]).type, 'Canvas');
assert.equal(vault.toPresentation3(projectedManifest).items[0].type, 'Canvas');

const vault4 = new Vault4();
const loadedManifest = vault4.loadManifestSync(manifestId, manifest);
assert(loadedManifest);
assert.equal(vault4.get(loadedManifest.items[0]).type, 'Timeline');
assert.equal(vault4.toPresentation4(loadedManifest).items[0].type, 'Timeline');

console.log('Packed @iiif/parser → @iiif/helpers Presentation 4 integration passed.');
