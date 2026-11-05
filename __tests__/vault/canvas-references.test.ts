import { describe, expect, test } from "vitest";
import { canvasLoadExternalAnnotationPages, getCanvasTranscription } from "../../src/transcriptions";
import { Vault } from "../../src/vault";
import { batchActions } from "../../src/vault/actions";
import { actionListFromResourceV3 } from "../../src/vault/utility/action-list-from-resource";

const canvasId = "https://example.org/canvas";
const pageId = "https://example.org/annotations";
const canvas = {
  id: canvasId,
  type: "Canvas",
  label: { en: ["Page 2"] },
  width: 2160,
  height: 3426,
  thumbnail: [{ id: "https://example.org/thumbnail.jpg", type: "Image", width: 63, height: 100 }],
  items: [
    {
      id: `${canvasId}/painting`,
      type: "AnnotationPage",
      items: [
        {
          id: `${canvasId}/image`,
          type: "Annotation",
          motivation: "painting",
          target: canvasId,
          body: { id: "https://example.org/image.jpg", type: "Image", width: 2160, height: 3426 },
        },
      ],
    },
  ],
  annotations: [{ id: pageId, type: "AnnotationPage" }],
};
// Wellcome's OCR pages embed a partial Canvas in partOf, without items.
const page = {
  id: pageId,
  type: "AnnotationPage",
  partOf: [{ id: canvasId, type: "Canvas", width: 2160, height: 3426 }],
  items: [
    {
      id: `${pageId}/line`,
      type: "Annotation",
      motivation: "supplementing",
      target: `${canvasId}#xywh=431,3207,450,49`,
      body: { type: "TextualBody", value: "22101329825" },
    },
  ],
};

describe("Canvas references in partOf", () => {
  test.each([false, true])("preserves painting and thumbnails when OCR loads first: %s", async (ocrFirst) => {
    const vault = new Vault({ customFetcher: async () => structuredClone(page) });
    if (ocrFirst) await vault.load(pageId);
    vault.loadSync(canvasId, structuredClone(canvas));
    await canvasLoadExternalAnnotationPages(vault, vault.get({ id: canvasId, type: "Canvas" }));

    const loaded = vault.get({ id: canvasId, type: "Canvas" });
    expect(loaded.items).toHaveLength(1);
    expect(loaded.thumbnail).toHaveLength(1);
    expect(loaded.annotations).toHaveLength(1);
    expect(loaded.label).toEqual(canvas.label);
    expect((await getCanvasTranscription(vault, loaded))?.plaintext).toContain("22101329825");
  });

  test.each([false, true])("a complete canvas can still clear its content inside partOf: %s", (insidePartOf) => {
    const vault = new Vault();
    vault.loadSync(canvasId, structuredClone(canvas));
    const emptyCanvas = {
      id: canvasId,
      type: "Canvas",
      width: 2160,
      height: 3426,
      items: [],
      thumbnail: [],
      label: null,
    };
    const update = insidePartOf ? { ...page, id: `${pageId}/update`, partOf: [emptyCanvas] } : emptyCanvas;
    vault.dispatch(
      batchActions({
        actions: actionListFromResourceV3(update.id, update),
      })
    );
    const loaded = vault.get({ id: canvasId, type: "Canvas" });
    expect(loaded.items).toEqual([]);
    expect(loaded.thumbnail).toEqual([]);
    expect(loaded.label).toBeNull();
  });
});
