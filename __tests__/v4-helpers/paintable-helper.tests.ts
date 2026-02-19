// @ts-nocheck
import invariant from 'tiny-invariant';
import { describe, expect, test } from 'vitest';
import choice from '../../fixtures/presentation-4/upgraded-from-p3/cookbook--choice.json';
import composite from '../../fixtures/presentation-4/upgraded-from-p3/cookbook--composite.json';
import multimedia from '../../fixtures/presentation-4/upgraded-from-p3/cookbook--multimedia.json';
import ldmax from '../../fixtures/presentation-4/upgraded-from-p3/p3--ldmax.json';
import { createPaintingAnnotationsHelper } from '../../src/painting-annotations';
import { Vault4 } from '../../src/vault/vault4';

describe('getPaintables', () => {
  test('extracting composite images', async () => {
    const vault = new Vault4();
    const manifest = await vault.loadManifest(choice.id, choice);

    expect(manifest).to.exist;
    invariant(manifest);
  });

  test('extracting choice', async () => {
    const vault = new Vault4();
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
    const vault = new Vault4();
    const manifest = await vault.loadManifest(multimedia.id, multimedia);

    expect(manifest).to.exist;
    invariant(manifest);

    const canvases = vault.get(manifest.items);
    const painting = createPaintingAnnotationsHelper(vault);
    const paintables = painting.getPaintables(canvases[0]);

    expect(paintables.items).toHaveLength(2);
    expect(paintables.items[0].resource.id).toMatchInlineSnapshot(
      `"https://iiif.io/api/image/3.0/example/reference/918ecd18c2592080851777620de9bcb5-gottingen/full/max/0/default.jpg"`
    );
    expect(paintables.items[1].resource.id).toMatchInlineSnapshot(
      `"https://fixtures.iiif.io/video/indiana/donizetti-elixir/vae0637_accessH264_low_act_1.mp4"`
    );
  });

  test('ldmax', async () => {
    const vault = new Vault4();
    const manifest = await vault.loadManifest(ldmax.id, ldmax);

    expect(manifest).to.exist;
    invariant(manifest);

    const canvases = vault.get(manifest.items);
    const painting = createPaintingAnnotationsHelper(vault);
    const paintables = painting.getPaintables(canvases[0]);

    expect(paintables).toMatchInlineSnapshot(`
      {
        "allChoices": null,
        "choice": null,
        "items": [
          {
            "annotation": {
              "annotations": [],
              "behavior": [],
              "body": {
                "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/body",
                "type": "ContentResource",
              },
              "homepage": [],
              "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/annotation/image",
              "iiif-parser:hasPart": [
                {
                  "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/annotation/image",
                  "iiif-parser:partOf": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/annotation",
                  "type": "Annotation",
                },
              ],
              "label": null,
              "metadata": [],
              "motivation": [
                "painting",
              ],
              "partOf": [],
              "provider": [],
              "rendering": [],
              "seeAlso": [],
              "service": [],
              "services": [],
              "summary": null,
              "target": {
                "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1",
                "type": "Canvas",
              },
              "thumbnail": [],
              "type": "Annotation",
            },
            "annotationId": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/annotation/image",
            "resource": {
              "action": [],
              "annotations": [],
              "behavior": [],
              "format": "image/jpeg",
              "homepage": [],
              "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/body",
              "iiif-parser:hasPart": [
                {
                  "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/body",
                  "iiif-parser:partOf": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1/annotation/image",
                  "type": "Image",
                },
              ],
              "items": [],
              "label": null,
              "language": [],
              "metadata": [],
              "partOf": [],
              "provider": [],
              "provides": [],
              "rendering": [],
              "seeAlso": [],
              "selector": [],
              "service": [
                {
                  "id": "https://ndeiiif.adlibhosting.com/iiif/3/Q4350196.180",
                  "profile": "level3",
                  "type": "ImageService3",
                },
              ],
              "services": [],
              "summary": null,
              "thumbnail": [],
              "transform": [],
              "type": "Image",
              "value": null,
            },
            "selector": null,
            "target": {
              "id": "https://n2t.net/ark:/67039/a5b1a9b3dad04c24b01bc7415beb8b71/iiif.json#/canvas/1",
              "type": "Canvas",
            },
            "type": "image",
          },
        ],
        "types": [
          "image",
        ],
      }
    `);
  });
});
