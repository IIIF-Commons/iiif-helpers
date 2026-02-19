// @ts-nocheck
import invariant from 'tiny-invariant';
import novieten from '../../fixtures/presentation-4/upgraded-from-p3/exhibitions--novieten.json';
import { expandTarget } from '../../src';
import { createPaintingAnnotationsHelper } from '../../src/painting-annotations';
import { Vault4 } from '../../src/vault/vault4';

describe('Exhibition helpers', () => {
  test('parsing exhibition', async () => {
    const vault = new Vault4();
    const manifest = await vault.loadManifest(novieten.id, novieten);

    expect(manifest).to.exist;
    invariant(manifest);

    const canvases = vault.get(manifest.items);
    const painting = createPaintingAnnotationsHelper(vault);

    const paintables = painting.getPaintables(canvases[0]);
    expect(paintables.items).toHaveLength(1);

    const expandedSelector = expandTarget({
      type: 'SpecificResource',
      source: paintables.items[0].resource,
      selector: paintables.items[0].selector,
    });
    expect(expandedSelector.selector).toMatchInlineSnapshot(`null`);

    const expandedTarget = expandTarget(paintables.items[0].target);
    expect(expandedTarget.selector).toMatchInlineSnapshot(`null`);
  });
});
