import mitt from "mitt";
import { ImageServer, createImageServiceStore, createImageServiceTryStore } from "../src/image-service";
import { describe, expect, test } from 'vitest';
import { ImageService } from "@iiif/presentation-3";
import { generateServiceFromImageUrl } from "../src/image-service/generate-service-from-image-url";

describe("ImageServiceTry", () => {

  test('Example image service try', () => {
    const dlcs = {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921",
      "@type": "iiif:Image",
      "profile": [
        "http://iiif.io/api/image/2/level0.json",
        {
          "formats": [
            "jpg"
          ],
          "qualities": [
            "color"
          ],
          "supports": [
            "sizeByWhListed"
          ]
        }
      ],
      "protocol": "http://iiif.io/api/image",
      "width": 1024,
      "height": 683,
      "sizes": [
        {
          "width": 100,
          "height": 67
        },
        {
          "width": 200,
          "height": 133
        },
        {
          "width": 400,
          "height": 267
        },
        {
          "width": 1024,
          "height": 683
        }
      ]
    };

    const loader = createImageServiceStore();
    const store = createImageServiceTryStore({
      loader: loader.store,
      events: mitt(),
      imageService: dlcs as ImageService
    });

    store.getState().try({ minWidth: 100000, height: 267 });
    store.getState().try({ width: 400, height: 267 });
    store.getState().try({ width: 200, height: 133 });
    store.getState().try({ width: 100, height: 67 });

    expect(
      store.getState().tryCursor
    ).toMatchInlineSnapshot(`1`);

    expect(
      store.getState().image()
    ).toMatchInlineSnapshot(`"https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921/full/400,/0/default.jpg"`);

    const { sizeByWhListed } = store.getState();

    const sizes = store.getState().sizes;
    expect(sizes).toEqual([
      { width: 100, height: 67 },
      { width: 200, height: 133 },
      { width: 400, height: 267 },
      { width: 1024, height: 683 }
    ]);

    expect(
      sizeByWhListed(sizes[0])
    ).toMatchInlineSnapshot(`"https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921/full/100,/0/default.jpg"`);
    expect(
      sizeByWhListed(sizes[1])
    ).toMatchInlineSnapshot(`"https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921/full/200,/0/default.jpg"`);
    expect(
      sizeByWhListed(sizes[2])
    ).toMatchInlineSnapshot(`"https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921/full/400,/0/default.jpg"`);
    expect(
      sizeByWhListed(sizes[3])
    ).toMatchInlineSnapshot(`"https://dlc.services/thumbs/7/18/9a4356aa-2953-4ce8-9b94-ec8b10bf7921/full/1024,/0/default.jpg"`);

    expect(store.getState()).toMatchSnapshot();
  });

  test('nls example', () => {
    const service = {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://view.nls.uk/iiif/7443/74438559.5",
      "profile": "http://iiif.io/api/image/2/profiles/level2.json",
      "height": 1781,
      "width": 2500
    };

    const loader = createImageServiceStore();
    const store = createImageServiceTryStore({
      loader: loader.store,
      events: mitt(),
      imageService: service as ImageService
    });


    const { generateImageUrlAtSize, ingestImageService, formats, level } = store.getState();

    expect(level).toBe(2);
    expect(formats).toMatchInlineSnapshot(`
      [
        "jpg",
        "png",
      ]
    `);

    expect(
      generateImageUrlAtSize({ width: 250 })
    ).toBe("https://view.nls.uk/iiif/7443/74438559.5/full/250,/0/default.jpg");

    // Now the full service.
    ingestImageService({
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://view.nls.uk/iiif/7443/74438559.5",
      "protocol": "http://iiif.io/api/image",
      "width": 2500,
      "height": 1778,
      "tiles": [
        {
          "width": 256,
          "height": 256,
          "scaleFactors": [
            1,
            2,
            4,
            8,
            16
          ]
        }
      ],
      "profile": [
        "http://iiif.io/api/image/2/level1.json",
        {
          "formats": [
            "jpg"
          ],
          "qualities": [
            "native",
            "color",
            "gray"
          ],
          "supports": [
            "regionByPct",
            "sizeByForcedWh",
            "sizeByWh",
            "sizeAboveFull",
            "rotationBy90s",
            "mirroring",
            "gray"
          ]
        }
      ]
    } as ImageService);

    expect(store.getState()).toMatchSnapshot();
  });


  test('Fixture - level 0, no thumbnail', () => {

    const service1 = {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor",
      "profile": "http://iiif.io/api/image/2/level0.json"
    };
    const service1Full = {
      "tiles": [
        {
          "scaleFactors": [
            32,
            16,
            8,
            4,
            2,
            1
          ],
          "width": 1024,
          "height": 1024
        }
      ],
      "protocol": "http://iiif.io/api/image",
      "sizes": [
        {
          "width": 126,
          "height": 95
        },
        {
          "width": 252,
          "height": 189
        },
        {
          "width": 504,
          "height": 378
        },
        {
          "width": 1008,
          "height": 756
        },
        {
          "width": 2016,
          "height": 1512
        },
        {
          "width": 4031,
          "height": 3023
        }
      ],
      "profile": "http://iiif.io/api/image/2/level0.json",
      "width": 4031,
      "@id": "https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor",
      "@context": "http://iiif.io/api/image/2/context.json",
      "height": 3023
    };


    const loader = createImageServiceStore();
    const store = createImageServiceTryStore({
      loader: loader.store,
      events: mitt(),
      imageService: service1 as ImageService
    });

    const { fullTiles, ingestImageService, sizeByWhListed, features } = store.getState();

    expect(fullTiles).toMatchInlineSnapshot(`[]`);
    expect(features).toMatchInlineSnapshot(`
      {
        "cors": false,
        "corsVerified": false,
        "sizeByH": false,
        "sizeByW": false,
        "sizeByWh": false,
        "sizeByWhListed": true,
      }
    `);

    ingestImageService(service1Full as ImageService);

    expect(store.getState()).toMatchSnapshot();

    expect(
      sizeByWhListed({ width: 126, height: 95 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor/full/126,/0/default.jpg"`);

    expect(
      sizeByWhListed({ width: 252, height: 189 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor/full/252,/0/default.jpg"`);

    expect(
      sizeByWhListed({ width: 504, height: 378 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor/full/504,/0/default.jpg"`);

    expect(
      sizeByWhListed({ width: 1008, height: 756 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/no_thum_prop/v2/level0/tractor/full/1008,/0/default.jpg"`);
  });

  test('Fixture - level 0 thumbnail', () => {
    const service = {
      "protocol": "http://iiif.io/api/image",
      "sizes": [
        {
          "width": 170,
          "height": 226
        },
        {
          "width": 340,
          "height": 452
        },
        {
          "width": 679,
          "height": 904
        },
        {
          "width": 1357,
          "height": 1808
        },
        {
          "width": 2714,
          "height": 3615
        },
        {
          "width": 5428,
          "height": 7230
        }
      ],
      "profile": "http://iiif.io/api/image/2/level0.json",
      "width": 5428,
      "@id": "https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_level0/titlepage1_verso",
      "@context": "http://iiif.io/api/image/2/context.json",
      "height": 7230
    };


    const loader = createImageServiceStore();
    const store = createImageServiceTryStore({
      loader: loader.store,
      events: mitt(),
      imageService: service as ImageService
    });

    expect(
      store.getState()
    ).toMatchSnapshot();

    const { sizeByWhListed } = store.getState();

    expect(
      sizeByWhListed({ width: 170, height: 226 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_level0/titlepage1_verso/full/170,/0/default.jpg"`);

    expect(
      sizeByWhListed({ width: 340, height: 452 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_level0/titlepage1_verso/full/340,/0/default.jpg"`);

    expect(
      sizeByWhListed({ width: 679, height: 904 })
    ).toMatchInlineSnapshot(`"https://iiif-commons.github.io/fixtures/examples/thumbnail/canvas/thum_prop/v2/canvas_thum_level0/titlepage1_verso/full/679,/0/default.jpg"`);
  });


  test('Situation with thumbnail where we only have a string', () => {

    const thumbnailString = 'https://iiif.io/api/image/2.1/example/reference/15f769d62ca9a3a2deca390efed75d73-4_titlepage1_verso/full/512,/0/default.jpg';

    const service = generateServiceFromImageUrl(thumbnailString, {
      "height": 7230,
      "width": 5428,
    });

    expect(service).toMatchInlineSnapshot(`
      {
        "@context": "http://iiif.io/api/image/2/context.json",
        "@id": "https://iiif.io/api/image/2.1/example/reference/15f769d62ca9a3a2deca390efed75d73-4_titlepage1_verso",
        "@type": "ImageService2",
        "profile": "http://iiif.io/api/image/2/level0.json",
        "protocol": "http://iiif.io/api/image",
        "sizes": [
          {
            "height": 682,
            "width": 512,
          },
        ],
      }
    `);

    const loader = createImageServiceStore();
    const store = createImageServiceTryStore({
      loader: loader.store,
      events: mitt(),
      imageService: service as ImageService
    });

    expect(store.getState()).toMatchSnapshot();

    const { sizeByWhListed } = store.getState();

    expect(
      sizeByWhListed({ width: 512, height: 682 })
    ).toEqual(thumbnailString);

    const fullService: ImageService = {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://iiif.io/api/image/2.1/example/reference/15f769d62ca9a3a2deca390efed75d73-4_titlepage1_verso",
      "height": 7230,
      "profile": [
        "http://iiif.io/api/image/2/level1.json",
        {
          "formats": [
            "jpg",
            "png"
          ],
          "qualities": [
            "default",
            "color",
            "gray"
          ]
        }
      ],
      "protocol": "http://iiif.io/api/image",
      "tiles": [
        {
          "height": 512,
          "scaleFactors": [
            1,
            2,
            4,
            8
          ],
          "width": 512
        }
      ],
      "width": 5428
    };

    store.getState().ingestImageService(fullService);

    expect(store.getState()).toMatchSnapshot();

  })
});
