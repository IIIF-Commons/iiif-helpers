import novieten from '../fixtures/exhibitions/novieten.json';
import { Vault } from '../src/vault';
import invariant from 'tiny-invariant';
import { createPaintingAnnotationsHelper } from '../src/painting-annotations';
import { expandTarget } from '../src';

describe('Exhibition helpers', () => {
  test('parsing exhibition', async () => {
    const vault = new Vault();
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
    expect(expandedSelector.selector).toMatchInlineSnapshot(`
      {
        "spatial": {
          "height": 2749,
          "unit": "pixel",
          "width": 2666,
          "x": 559,
          "y": 0,
        },
        "type": "BoxSelector",
      }
    `);

    const expandedTarget = expandTarget(paintables.items[0].target);
    expect(expandedTarget.selector).toMatchInlineSnapshot(`
      {
        "spatial": {
          "height": 2749,
          "unit": "pixel",
          "width": 2666,
          "x": 0,
          "y": 0,
        },
        "type": "BoxSelector",
      }
    `);
  });
});
