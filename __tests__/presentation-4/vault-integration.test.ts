import type { ManifestNormalized } from "@iiif/parser/presentation-3-normalized/types";
import type { ManifestNormalized as ManifestNormalizedV4 } from "@iiif/parser/presentation-4-normalized/types";
import invariant from "tiny-invariant";
import { describe, expect, test } from "vitest";
import { Vault } from "../../src/vault";
import { Vault4 } from "../../src/vault/vault4";

const manifestId = "https://example.org/iiif/manifest";
const containerId = "https://example.org/iiif/container/1";

const presentation4Manifest = {
  "@context": "http://iiif.io/api/presentation/4/context.json",
  id: manifestId,
  type: "Manifest",
  label: { en: ["Presentation 4 timeline"] },
  items: [
    {
      id: containerId,
      type: "Timeline",
      duration: 30,
      items: [],
    },
  ],
};

describe("Presentation 4 Vault integration", () => {
  test("Vault4 consumes the explicit Presentation 4 view", () => {
    const vault = new Vault4();
    const manifest = vault.loadManifestSync(manifestId, presentation4Manifest);
    invariant(manifest);

    const timeline = vault.get<ManifestNormalizedV4["items"][number]>(manifest.items[0]);
    expect(timeline.type).toBe("Timeline");
    expect(timeline.id).toBe(containerId);

    const serialized = vault.toPresentation4<any>(manifest);
    expect(serialized["@context"]).toBe("http://iiif.io/api/presentation/4/context.json");
    expect(serialized.items[0].type).toBe("Timeline");
  });

  test("Vault4 converts through Presentation 3 before serializing Presentation 2", () => {
    const canvasId = "https://example.org/iiif/canvas/1";
    const imageId = "https://example.org/iiif/image/1.jpg";
    const vault = new Vault4();
    const manifest = vault.loadManifestSync(manifestId, {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: manifestId,
      type: "Manifest",
      label: { en: ["Presentation 4 image"] },
      items: [
        {
          id: canvasId,
          type: "Canvas",
          width: 1000,
          height: 800,
          items: [
            {
              id: `${canvasId}/page/1`,
              type: "AnnotationPage",
              items: [
                {
                  id: `${canvasId}/annotation/1`,
                  type: "Annotation",
                  motivation: ["painting"],
                  body: {
                    id: imageId,
                    type: "Image",
                    format: "image/jpeg",
                    width: 1000,
                    height: 800,
                  },
                  target: { id: canvasId, type: "Canvas" },
                },
              ],
            },
          ],
        },
      ],
    });
    invariant(manifest);

    const presentation2 = vault.toPresentation2<any>(manifest);
    expect(presentation2.sequences[0].canvases[0].images[0].resource).toMatchObject({
      "@id": imageId,
      "@type": "dctypes:Image",
    });
    expect(JSON.stringify(presentation2)).not.toContain("__$UNSET$__");

    const timelineVault = new Vault4();
    const timelineManifest = timelineVault.loadManifestSync(manifestId, presentation4Manifest);
    invariant(timelineManifest);
    expect(JSON.stringify(timelineVault.toPresentation2(timelineManifest))).not.toContain("__$UNSET$__");
  });

  test("Vault projects Presentation 4 input to its fixed Presentation 3 view", () => {
    const vault = new Vault();
    const manifest = vault.loadManifestSync(manifestId, presentation4Manifest);
    invariant(manifest);

    const canvas = vault.get<ManifestNormalized["items"][number]>(manifest.items[0]);
    expect(canvas.type).toBe("Canvas");
    expect(canvas.id).toBe(containerId);

    const serialized = vault.toPresentation3<any>(manifest);
    expect(serialized["@context"]).toBe("http://iiif.io/api/presentation/3/context.json");
    expect(serialized.items[0].type).toBe("Canvas");
  });
});
