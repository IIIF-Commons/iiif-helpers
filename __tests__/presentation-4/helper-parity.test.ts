import { describe, expect, test, vi } from "vitest";
import {
  containerHasTranscriptionSync,
  createRangeHelper,
  createSequenceHelper,
  createThumbnailHelper,
  expandTarget,
  findAllCanvasesInRange,
  findAllContainersInRange,
  findSelectedRange,
  getAvailableLanguagesFromResource,
  normaliseContentState,
  parseSelector,
} from "../../src";
import { compatVault } from "../../src/compat";
import { Vault4 } from "../../src/vault/vault4";

describe("Presentation 4 helper parity", () => {
  test("range helpers resolve normalized P4 SpecificResource references", () => {
    const canvasId = "https://example.org/canvas/normalized";
    const rangeId = "https://example.org/range/normalized";
    const manifestId = "https://example.org/manifest/normalized";
    const vault = new Vault4();
    const manifest = vault.loadManifestSync(manifestId, {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: manifestId,
      type: "Manifest",
      label: { en: ["Manifest"] },
      items: [
        {
          id: canvasId,
          type: "Canvas",
          label: { en: ["Canvas"] },
          width: 1000,
          height: 1000,
          items: [],
        },
      ],
      structures: [
        {
          id: rangeId,
          type: "Range",
          label: { en: ["Range"] },
          items: [`${canvasId}#t=0,10`],
        },
      ],
    });
    const range = vault.get(manifest!.structures[0]);

    expect(range.items[0].type).toBe("ContentResource");
    expect(findAllCanvasesInRange(vault, range)).toEqual([{ id: canvasId, type: "Canvas" }]);
    expect(createSequenceHelper(vault).getManifestSequence(range)[0]).toEqual([{ id: canvasId, type: "Canvas" }]);
    expect(findSelectedRange(vault, range, canvasId)).toBe(range);
  });

  test("ranges expose ordered unique containers while Canvas APIs remain type-safe", () => {
    const range = {
      id: "https://example.org/range",
      type: "Range",
      items: [
        { id: "https://example.org/canvas/1", type: "Canvas" },
        {
          type: "SpecificResource",
          source: { id: "https://example.org/canvas/1#xywh=1,2,3,4", type: "Canvas" },
        },
        { id: "https://example.org/timeline/1", type: "Timeline" },
        {
          id: "https://example.org/range/nested",
          type: "Range",
          items: [
            { id: "https://example.org/scene/1", type: "Scene" },
            { type: "SpecificResource", source: "https://example.org/canvas/2#t=1,2" },
          ],
        },
      ],
    } as any;

    expect(findAllContainersInRange(compatVault, range)).toEqual([
      { id: "https://example.org/canvas/1", type: "Canvas" },
      { id: "https://example.org/timeline/1", type: "Timeline" },
      { id: "https://example.org/scene/1", type: "Scene" },
      { id: "https://example.org/canvas/2", type: "Canvas" },
    ]);
    expect(findAllCanvasesInRange(compatVault, range)).toEqual([
      { id: "https://example.org/canvas/1", type: "Canvas" },
      { id: "https://example.org/canvas/2", type: "Canvas" },
    ]);
    expect(createRangeHelper().findAllContainersInRange(range)).toHaveLength(4);
    expect(findSelectedRange(compatVault, range, "https://example.org/canvas/1")).toBe(range);

    const [sequence] = createSequenceHelper().getManifestSequence({
      id: "https://example.org/manifest",
      type: "Manifest",
      behavior: [],
      items: range.items.slice(0, 3),
    } as any);
    expect(sequence).toEqual([{ id: "https://example.org/canvas/1", type: "Canvas" }]);
  });

  test("range selection supports Scenes and Timelines, fragments, missing references, and cycles", () => {
    const nested = {
      id: "https://example.org/range/nested",
      type: "Range",
      items: [
        { id: "https://example.org/scene#t=1,2", type: "Scene" },
        { type: "SpecificResource", source: { id: "https://example.org/timeline", type: "Timeline" } },
        "https://example.org/canvas#t=1,2",
      ],
    } as any;
    const root = { id: "https://example.org/range/root", type: "Range", items: [nested] } as any;
    nested.items.unshift(root, { id: "https://example.org/missing", type: "Range" });
    for (const id of ["scene", "timeline", "canvas"]) {
      expect(findSelectedRange(compatVault, root, `https://example.org/${id}`)).toBe(nested);
    }
    expect(findSelectedRange(compatVault, root, "https://example.org/absent")).toBeNull();
  });

  test("selector arrays receive stylesheets and expanded targets retain v4 interaction fields without mutation", () => {
    const parsed = parseSelector(
      [{ type: "FragmentSelector", value: "xywh=1,2,3,4" }],
      { loadedStylesheets: { "https://example.org/style.css": ".hot { background: red }" } },
      { styleClass: "hot" }
    );
    expect(parsed.selector?.boxStyle).toEqual({ background: "red" });

    const target = {
      type: "SpecificResource",
      source: {
        id: "https://example.org/scene",
        type: "Scene",
      },
      selector: [{ type: "FragmentSelector", value: "xywh=1,2,3,4" }],
      styleClass: "hot",
      transform: [{ type: "TranslateTransform", x: 1 }],
      action: [{ id: "https://example.org/action", type: "Annotation" }],
    };
    const original = structuredClone(target);
    const expanded = expandTarget(target as never, {
      loadedStylesheets: { "https://example.org/style.css": ".hot { background: red }" },
    });

    expect(expanded.transform).toEqual(target.transform);
    expect(expanded.action).toEqual(target.action);
    expect(expanded.selector?.boxStyle).toEqual({ background: "red" });
    expect(target).toEqual(original);
  });

  test("language discovery covers nested v4 containers and language arrays", () => {
    const timeline = {
      id: "https://example.org/timeline",
      type: "Timeline",
      duration: 10,
      label: { en: ["Timeline"] },
      items: [
        {
          id: "https://example.org/scene",
          type: "Scene",
          summary: { fr: ["Scène"] },
          items: [
            {
              id: "https://example.org/page",
              type: "AnnotationPage",
              items: [
                {
                  id: "https://example.org/annotation",
                  type: "Annotation",
                  motivation: ["painting"],
                  body: { type: "TextualBody", value: "Hallo", language: ["de", "nl"] },
                  target: "https://example.org/scene",
                },
              ],
            },
          ],
        },
      ],
    } as any;

    expect(getAvailableLanguagesFromResource(timeline)).toEqual(["en", "fr", "de", "nl"]);
  });

  test("thumbnail dimension fallback does not mutate hydrated content", async () => {
    const getThumbnailFromResource = vi.fn(async (resource) => ({
      best: resource,
      fallback: [],
      log: [],
    }));
    const helper = createThumbnailHelper(compatVault, {
      imageServiceLoader: {
        getImageCandidates: vi.fn(async () => []),
        getThumbnailFromResource,
      } as any,
    });
    const body = { id: "https://example.org/image", type: "Image", format: "image/jpeg" };

    await helper.getBestThumbnailAtSize(
      {
        id: "https://example.org/canvas",
        type: "Canvas",
        width: 640,
        height: 480,
        items: [
          {
            id: "https://example.org/page",
            type: "AnnotationPage",
            items: [
              {
                id: "https://example.org/annotation",
                type: "Annotation",
                motivation: ["painting"],
                body,
                target: "https://example.org/canvas",
              },
            ],
          },
        ],
      } as any,
      { width: 100, height: 100 }
    );

    expect(body).not.toHaveProperty("width");
    expect(getThumbnailFromResource).toHaveBeenLastCalledWith(
      { ...body, width: 640, height: 480 },
      { width: 100, height: 100 },
      false,
      []
    );
  });

  test("content-state motivations accumulate across annotation inputs", () => {
    expect(
      normaliseContentState([
        {
          id: "https://example.org/annotation/1",
          type: "Annotation",
          motivation: ["bookmarking"],
          target: "https://example.org/canvas/1",
        },
        {
          id: "https://example.org/annotation/2",
          type: "Annotation",
          motivation: ["highlighting", "bookmarking"],
          target: "https://example.org/canvas/2",
        },
      ] as any).motivation
    ).toEqual(["contentState", "bookmarking", "highlighting"]);
  });

  test("Container transcription aliases accept a Timeline", () => {
    const timeline = {
      id: "https://example.org/timeline",
      type: "Timeline",
      duration: 10,
      annotations: [
        {
          id: "https://example.org/page",
          type: "AnnotationPage",
          items: [
            {
              id: "https://example.org/annotation",
              type: "Annotation",
              motivation: ["supplementing"],
              body: { type: "TextualBody", value: "Timeline transcript" },
              target: "https://example.org/timeline",
            },
          ],
        },
      ],
    } as any;

    expect(containerHasTranscriptionSync(compatVault, timeline)).toBe(true);
  });
});
