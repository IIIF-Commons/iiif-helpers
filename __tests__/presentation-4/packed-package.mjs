import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const helpersPackage = '@iiif/helpers';
const parserPackage = '@iiif/parser';
const { Vault } = await import(`${helpersPackage}/vault`);
const { Vault4 } = await import(`${helpersPackage}/vault-4`);
const { Presentation4CompatibilityError } = await import(`${parserPackage}/upgrader`);

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

const sceneManifest = {
  ...manifest,
  id: `${manifestId}/scene`,
  items: [{ id: `${containerId}/scene`, type: 'Scene', items: [] }],
};
assert.throws(
  () => vault.loadManifestSync(sceneManifest.id, sceneManifest),
  (error) =>
    error instanceof Presentation4CompatibilityError &&
    error.diagnostics[0]?.code === 'presentation-4-scene-unsupported' &&
    error.diagnostics[0]?.path === '$.items[0]'
);

const publicSubpaths = JSON.parse(
  await readFile(new URL('./public-subpaths.json', import.meta.url), 'utf8')
);
for (const specifier of publicSubpaths) {
  assert(await import(specifier), `ESM import failed for ${specifier}`);
}

const require = createRequire(import.meta.url);
for (const specifier of publicSubpaths) {
  assert(require(specifier), `CJS require failed for ${specifier}`);
}

console.log(
  `Packed @iiif/parser → @iiif/helpers integration passed for ${publicSubpaths.length} ESM/CJS subpaths.`
);
