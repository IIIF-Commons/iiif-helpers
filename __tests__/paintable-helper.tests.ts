import { describe, test, expect } from 'vitest';
import choice from '../fixtures/cookbook/choice.json';
import composite from '../fixtures/cookbook/composite.json';
import multimedia from '../fixtures/cookbook/multimedia.json';
import { Vault } from '../src/vault';
import invariant from 'tiny-invariant';
import { createPaintingAnnotationsHelper } from '../src/painting-annotations';

describe('getPaintables', () => {
  test('extracting composite images', async () => {
    const vault = new Vault();
    const manifest = await vault.loadManifest(choice.id, choice);

    expect(manifest).to.exist;
    invariant(manifest);
  });

  test('extracting choice', async () => {
    const vault = new Vault();
    const manifest = await vault.loadManifest(composite.id, composite);

    expect(manifest).to.exist;
    invariant(manifest);

    const canvases = vault.get(manifest.items);
    const painting = createPaintingAnnotationsHelper(vault);
    const paintables = painting.getPaintables(canvases[0]);

    expect(paintables.items).toHaveLength(2);
    expect(paintables.items[0].resource.id).toEqual(
      'https://iiif.io/api/image/3.0/example/reference/899da506920824588764bc12b10fc800-bnf_chateauroux/full/max/0/default.jpg'
    );
    expect(paintables.items[1].resource.id).toEqual(
      'https://iiif.io/api/image/3.0/example/reference/899da506920824588764bc12b10fc800-bnf_chateauroux_miniature/full/max/0/native.jpg'
    );
  });

  test('multimedia', async () => {
    const vault = new Vault();
    const manifest = await vault.loadManifest(multimedia.id, multimedia);

    expect(manifest).to.exist;
    invariant(manifest);

    const canvases = vault.get(manifest.items);
    const painting = createPaintingAnnotationsHelper(vault);
    const paintables = painting.getPaintables(canvases[0]);

    expect(paintables.items).toHaveLength(2);
    expect(paintables.items[0].resource.id).toMatchInlineSnapshot(`"https://iiif.io/api/image/3.0/example/reference/918ecd18c2592080851777620de9bcb5-gottingen/full/max/0/default.jpg"`);
    expect(paintables.items[1].resource.id).toMatchInlineSnapshot(`"https://fixtures.iiif.io/video/indiana/donizetti-elixir/vae0637_accessH264_low_act_1.mp4"`);
  });
});
