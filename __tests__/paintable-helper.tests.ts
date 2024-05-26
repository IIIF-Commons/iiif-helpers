import { describe, test, expect } from 'vitest';
import choice from '../fixtures/cookbook/choice.json';
import composite from '../fixtures/cookbook/composite.json';
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
});
