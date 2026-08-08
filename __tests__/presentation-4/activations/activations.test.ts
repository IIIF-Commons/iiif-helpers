import { describe, expect, test } from "vitest";
import commentsWithCameras from "../fixtures/official-3d/uc08_3d_comments_with_cameras.json";
import { createActivationsHelper } from "../../../src/activations";
import { Vault4 } from "../../../src/vault/vault4";

describe("optional Presentation 4 Activation helpers", () => {
  test("finds and parses the pinned activating annotation as an ordered transaction", () => {
    const vault = new Vault4();
    vault.loadManifestSync(commentsWithCameras.id, commentsWithCameras);
    const helper = createActivationsHelper(vault);

    const annotations = helper.getAllActivatingAnnotations(commentsWithCameras.id);
    expect(annotations.map(({ id }) => id)).toEqual(["https://iiif.io/api/presentation/4.0/example/uc08/3d/anno9"]);

    const transaction = helper.parseActivatingAnnotation(annotations[0]);
    expect(transaction).toMatchObject({
      annotationId: "https://iiif.io/api/presentation/4.0/example/uc08/3d/anno9",
      steps: [
        {
          source: {
            id: "https://iiif.io/api/presentation/4.0/example/uc08/3d/anno-that-paints-desired-camera-to-view-tooth",
            type: "Annotation",
          },
          selector: null,
          transform: [],
          actions: ["show", "enable", "select"],
        },
      ],
    });

    expect(
      helper.getActivationsForTarget(
        commentsWithCameras.id,
        "https://iiif.io/api/presentation/4.0/example/uc08/3d/commenting-anno-for-mandibular-tooth"
      )
    ).toEqual([transaction]);
    expect(helper.getActivationsForTarget(commentsWithCameras.id, annotations[0].id)).toEqual([transaction]);
  });

  test("hydrates ordered SpecificResources inside an aggregate body", () => {
    const manifest = {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: "https://example.org/activation-list/manifest",
      type: "Manifest",
      label: { en: ["Activation list"] },
      items: [
        {
          id: "https://example.org/activation-list/scene",
          type: "Scene",
          items: [
            {
              id: "https://example.org/activation-list/page",
              type: "AnnotationPage",
              items: [
                {
                  id: "https://example.org/activation-list/a",
                  type: "Annotation",
                  motivation: ["painting"],
                  body: { id: "https://example.org/a.glb", type: "Model" },
                  target: { id: "https://example.org/activation-list/scene", type: "Scene" },
                },
                {
                  id: "https://example.org/activation-list/b",
                  type: "Annotation",
                  motivation: ["painting"],
                  body: { id: "https://example.org/b.glb", type: "Model" },
                  target: { id: "https://example.org/activation-list/scene", type: "Scene" },
                },
              ],
            },
          ],
          annotations: [
            {
              id: "https://example.org/activation-list/annotations",
              type: "AnnotationPage",
              items: [
                {
                  id: "https://example.org/activation-list/activation",
                  type: "Annotation",
                  motivation: ["activating"],
                  target: { id: "https://example.org/activation-list/trigger", type: "Annotation" },
                  body: {
                    id: "https://example.org/activation-list/body",
                    type: "List",
                    items: [
                      {
                        id: "https://example.org/activation-list/hide",
                        type: "SpecificResource",
                        source: { id: "https://example.org/activation-list/a", type: "Annotation" },
                        action: ["hide"],
                      },
                      {
                        id: "https://example.org/activation-list/show",
                        type: "SpecificResource",
                        source: { id: "https://example.org/activation-list/b", type: "Annotation" },
                        transform: [{ type: "TranslateTransform", x: 1, y: 2, z: 3 }],
                        action: ["show"],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    } as any;
    const vault = new Vault4();
    vault.loadManifestSync(manifest.id, manifest);
    const transaction = createActivationsHelper(vault).parseActivatingAnnotation(
      "https://example.org/activation-list/activation"
    );

    expect(transaction?.steps).toMatchObject([
      {
        source: { id: "https://example.org/activation-list/a", type: "Annotation" },
        actions: ["hide"],
        transform: [],
        aggregatePath: [{ type: "List", index: 0 }],
      },
      {
        source: { id: "https://example.org/activation-list/b", type: "Annotation" },
        actions: ["show"],
        transform: [{ type: "TranslateTransform", x: 1, y: 2, z: 3 }],
        aggregatePath: [{ type: "List", index: 1 }],
      },
    ]);
  });

  test("finds activating annotations below Timeline containers", () => {
    const manifest = {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: "https://example.org/timeline-activation/manifest",
      type: "Manifest",
      label: { en: ["Timeline activation"] },
      items: [
        {
          id: "https://example.org/timeline-activation/timeline",
          type: "Timeline",
          duration: 10,
          items: [],
          annotations: [
            {
              id: "https://example.org/timeline-activation/page",
              type: "AnnotationPage",
              items: [
                {
                  id: "https://example.org/timeline-activation/annotation",
                  type: "Annotation",
                  motivation: ["activating"],
                  body: { id: "https://example.org/timeline-activation/model", type: "Model" },
                  target: {
                    id: "https://example.org/timeline-activation/trigger",
                    type: "Annotation",
                  },
                },
              ],
            },
          ],
        },
      ],
    } as any;
    const vault = new Vault4();
    vault.loadManifestSync(manifest.id, manifest);

    expect(
      createActivationsHelper(vault)
        .getAllActivatingAnnotations(manifest.id)
        .map(({ id }) => id)
    ).toEqual(["https://example.org/timeline-activation/annotation"]);
  });
});
