import { describe, expect, test } from "vitest";
import cookbook from "../fixtures/thumbnails/cookbook-0232-image.json";
import {
  getCustomSizeFromService,
  getImageCandidatesFromService,
  getImageCandidates,
  getImageFromTileSource,
  getSmallestScaleFactorAsSingleImage,
  isImage3,
  ImageServiceLoader,
  pickBestFromCandidates,
} from "../src/image-service";
import { createThumbnailHelper } from "../src/thumbnail";
import { Vault } from "../src/vault";
import { Vault4 } from "../src/vault/vault4";

describe("Image API candidate regressions", () => {
  test.each([
    { type: "ImageService3" },
    { "@context": "http://iiif.io/api/image/3/context.json" },
    { "@context": ["http://iiif.io/api/image/3/context.json"] },
  ])("recognizes an API 3 service from %j", (identity) => {
    const service = {
      ...identity,
      id: "https://example.org/image",
      profile: "level0",
      sizes: [{ width: 252, height: 189 }],
    };
    expect(isImage3(service)).toBe(true);
    const candidates = getImageCandidatesFromService([service as any]);
    expect(candidates[0]).toMatchObject({ version: 3, width: 252, height: 189 });
    expect(pickBestFromCandidates({ width: 250, height: 200 }, [() => candidates]).best).toMatchObject({
      id: "https://example.org/image/full/252,189/0/default.jpg",
      width: 252,
      height: 189,
    });
  });

  test("serializes an API 3 candidate with its version even when it has no service context", () => {
    expect(
      getImageFromTileSource(
        { id: "https://example.org/image", type: "fixed-service", version: 3, level: 0, width: 252, height: 189 },
        252,
        189
      )
    ).toMatchObject({ id: "https://example.org/image/full/252,189/0/default.jpg", width: 252, height: 189 });
  });

  test("infers the missing API 3 output height with integer rounding", () => {
    expect(
      getImageFromTileSource(
        { id: "https://example.org/image", type: "fixed-service", version: 3, level: 1, width: 1000, height: 751 },
        250
      )
    ).toMatchObject({ id: "https://example.org/image/full/250,188/0/default.jpg", width: 250, height: 188 });
  });

  test("retains the API 2 canonical width-only URL", () => {
    expect(
      getImageFromTileSource(
        { id: "https://example.org/image", type: "fixed-service", version: 2, level: 0, width: 252, height: 189 },
        252,
        189
      )
    ).toMatchObject({ id: "https://example.org/image/full/252,/0/default.jpg", width: 252, height: 189 });
    expect(isImage3({ type: "ImageService2" })).toBe(false);
  });

  test.each([{ type: "ImageService3" }, { "@context": ["http://iiif.io/api/image/3/context.json"] }])(
    "keeps API 3 version on profile-limited custom candidates (%j)",
    (identity) => {
      expect(
        getCustomSizeFromService({
          ...identity,
          id: "https://example.org/image",
          width: 2000,
          height: 1000,
          profile: ["level1", { maxWidth: 1000, maxHeight: 800 }],
        } as any)
      ).toMatchObject([{ version: 3, maxWidth: 1000, maxHeight: 800 }]);
    }
  );

  test.each([
    [2000, 1000, 256, 128],
    [1000, 2000, 128, 256],
  ])(
    "preserves a %sx%s service's aspect ratio when choosing a custom thumbnail",
    (width, height, outWidth, outHeight) => {
      const candidates = getImageCandidates(
        {
          id: "https://example.org/original.jpg",
          type: "Image",
          width,
          height,
          service: [
            {
              id: "https://example.org/image",
              type: "ImageService3",
              profile: "level1",
              tiles: [{ width: 512, scaleFactors: [1, 2, 4] }],
            },
          ],
        } as any,
        false,
        new ImageServiceLoader({ enableFetching: false })
      );
      expect(pickBestFromCandidates({ width: 256, height: 256 }, [() => candidates]).best).toMatchObject({
        id: `https://example.org/image/full/${outWidth},${outHeight}/0/default.jpg`,
        width: outWidth,
        height: outHeight,
      });
    }
  );

  test("does not guess a square API 3 size when the image's dimensions are unknown", () => {
    expect(
      getCustomSizeFromService({
        id: "https://example.org/image",
        type: "ImageService3",
        profile: "level1",
        tiles: [{ width: 512, scaleFactors: [1, 2, 4] }],
      } as any)
    ).toEqual([]);
  });

  // Unmodified published example:
  // https://iiif.io/api/cookbook/recipe/0232-image-thumbnail-canvas/manifest-image.json
  test.each([
    ["compatibility vault", () => new Vault()],
    ["native vault", () => new Vault4()],
  ] as const)("uses advertised recipe 0232 sizes through the %s", async (_, createVault) => {
    const vault = createVault();
    vault.loadSync(cookbook.id, structuredClone(cookbook));
    const helper = createThumbnailHelper(vault);
    for (const canvas of cookbook.items) {
      const thumbnail = canvas.thumbnail[0]!;
      const service = thumbnail.service[0]!;
      const result = await helper.getBestThumbnailAtSize(
        { id: canvas.id, type: "Canvas" },
        { width: 256, height: 256 }
      );
      const best = result.best;
      expect(best?.type).toBe("fixed");
      expect(best?.id).toBe(`${service.id}/full/${thumbnail.width},${thumbnail.height}/0/default.jpg`);
      expect(best).toMatchObject({ width: thumbnail.width, height: thumbnail.height });
      expect(service.sizes).toContainEqual({ width: thumbnail.width, height: thumbnail.height });
    }
  });

  test("orders numeric scales and rounds up without mutating shared service metadata", () => {
    const scales = Object.freeze([1, 16, 2, 4, 8]);
    const tiles = Object.freeze([
      Object.freeze({ width: 512, scaleFactors: scales }),
      Object.freeze({ width: 256, scaleFactors: Object.freeze([1, 2]) }),
    ]);
    const service = Object.freeze({
      id: "https://example.org/image",
      type: "ImageService3",
      profile: "level0",
      width: 2001,
      height: 1001,
      tiles,
    });
    expect(getSmallestScaleFactorAsSingleImage(service as any)).toMatchObject({
      width: 501,
      height: 251,
      version: 3,
    });
    expect(tiles[0]!.scaleFactors).toEqual([1, 16, 2, 4, 8]);
  });

  test("fits the full image inside a rectangular tile's width and height", () => {
    expect(
      getSmallestScaleFactorAsSingleImage({
        id: "https://example.org/image",
        profile: "level0",
        width: 1024,
        height: 2048,
        tiles: [{ width: 512, height: 256, scaleFactors: [1, 2, 4, 8] }],
      })
    ).toMatchObject({ width: 128, height: 256 });
  });
});
