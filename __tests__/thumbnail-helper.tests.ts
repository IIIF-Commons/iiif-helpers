import { describe, expect, test } from 'vitest';
import { Vault } from '../src/vault';
import { ThumbnailOutput, createThumbnailHelper } from '../src/thumbnail';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { upgrade } from '@iiif/parser/upgrader';

export const thumbnailFixtures = [
  {
    label: 'Canvas with no thumbnail property - ImageService',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/image_service2/manifest.json',
    description:
      'This is a manifest where there is no thumbnail property but the thumbnail can be generated from the image service.',
  },
  {
    label: 'Canvas with no thumbnail property - level0 image',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/manifest.json',
    description:
      'This is a manifest where there is no thumbnail property but the thumbnail can be generated from the level 0 image service.',
  },
  {
    label: 'Canvas with no thumbnail property - simple image',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/simple_image/manifest.json',
    description:
      'This is a manifest where there is no thumbnail property. There is a single image painted onto the canvas',
  },
  {
    label: 'Canvases with thumbnail property which is an image URL',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_url/manifest.json',
    description: 'Each canvas has a thumbnail property which is a URL to an image',
  },
  {
    label: 'Canvases with thumbnail property which is an image URL with dimensions',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_dimensions/manifest.json',
    description:
      'Each canvas has a thumbnail property which is a URL to an image. The thumbnail property includes a type but no image service',
  },
  {
    label: 'Canvases with thumbnail property with level0 image service (Most optimised option)',
    url: 'https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_level0/manifest.json',
    description:
      'This is an efficient way of advertising various sizes for a thumbnail and allows a producer to cache copies of thumbnails to make them fast to retrieve.',
  },
];

describe('Thumbnail helper', function () {
  test.each(thumbnailFixtures as { label: string; description: string }[])(`Thumbnail - $label`, async (fixture) => {
    const vault = new Vault();
    const helper = createThumbnailHelper(vault);
    const manifestJson: any = JSON.parse(
      (await readFile(path.join(process.cwd(), 'fixtures/thumbnails', `${fixture.label}.json`))).toString()
    );
    const manifest = await vault.load<ManifestNormalized>(manifestJson.id || manifestJson['@id'], manifestJson);

    if (!manifest) {
      expect.fail(`Invalid manifest`);
    }

    const thumbnails: ThumbnailOutput[] = [];
    for (const canvas of manifest.items) {
      thumbnails.push(helper.getBestThumbnailAtSize(canvas, { width: 256, height: 256 }));
    }

    expect(await Promise.all(thumbnails)).toMatchSnapshot();
  });

  test.each(thumbnailFixtures as { label: string; description: string }[])(
    `Thumbnail - $label (no vault)`,
    async (fixture) => {
      const helper = createThumbnailHelper();
      const manifest: any = upgrade(
        JSON.parse(
          (await readFile(path.join(process.cwd(), 'fixtures/thumbnails', `${fixture.label}.json`))).toString()
        )
      );

      if (!manifest) {
        expect.fail(`Invalid manifest`);
      }

      const thumbnails: ThumbnailOutput[] = [];
      for (const canvas of manifest.items) {
        thumbnails.push(helper.getBestThumbnailAtSize(canvas, { width: 256, height: 256 }));
      }

      expect(await Promise.all(thumbnails)).toMatchSnapshot();
    }
  );
});
