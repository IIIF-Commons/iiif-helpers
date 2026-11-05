import { Vault } from "../../src/vault";
import { actionListFromResourceV3 } from "../../src/vault/utility/action-list-from-resource";
import { describe, expect, test } from "vitest";
import { Vault4 } from "../../src/vault/vault4";
import { actionListFromResourceV4 } from "../../src/vault/utility/action-list-from-resource";
import { batchActions } from "../../src/vault/actions";

describe.each(["Canvas", "Scene", "Timeline"] as const)("%s references in external annotations", (type) => {
  test("retains a loaded container when a supplementary page references it", () => {
    const vault = new Vault4();
    const id = `https://example.org/${type}`;
    vault.loadSync(id, {
      id,
      type,
      width: 200,
      height: 300,
      duration: 12,
      label: { en: ["Loaded container"] },
      items: [{ id: `${id}/painting`, type: "AnnotationPage", items: [] }],
      annotations: [{ id: `${id}/comments`, type: "AnnotationPage" }],
    } as any);
    vault.loadSync(`${id}/comments`, {
      id: `${id}/comments`,
      type: "AnnotationPage",
      items: [
        {
          id: `${id}/comment`,
          type: "Annotation",
          motivation: ["commenting"],
          body: { type: "TextualBody", value: "Comment" },
          target: {
            type: "SpecificResource",
            source: { id, type },
            selector: [{ type: "PointSelector", x: 1, y: 2, z: 3 }],
          },
        },
      ],
    });
    const loaded = vault.get<any>(id);
    expect(loaded.label).toEqual({ en: ["Loaded container"] });
    expect(loaded.items).toHaveLength(1);
    expect(loaded.annotations).toHaveLength(1);
    if (type !== "Scene") expect(loaded.duration).toBe(12);
    if (type === "Canvas") expect([loaded.width, loaded.height]).toEqual([200, 300]);
  });
  test("still permits an authoritative update to clear content", () => {
    const vault = new Vault4();
    const id = `https://example.org/${type}`;
    vault.loadSync(id, {
      id,
      type,
      label: { en: ["Loaded"] },
      width: 200,
      height: 300,
      duration: 12,
      items: [{ id: `${id}/p`, type: "AnnotationPage", items: [] }],
    } as any);
    vault.dispatch(
      batchActions({
        actions: actionListFromResourceV4(id, {
          id,
          type,
          width: 200,
          height: 300,
          duration: 0,
          items: [],
          label: null,
        }),
      })
    );
    expect(vault.get<any>(id).items).toEqual([]);
    expect(vault.get<any>(id).label).toBeNull();
  });
});

test("clears a v2 collection using the collections property", () => {
  const vault = new Vault();
  const base = {
    "@context": "http://iiif.io/api/presentation/2/context.json",
    "@id": "https://example.org/collection",
    "@type": "sc:Collection",
  };
  const put = (resource: object) =>
    vault.dispatch(batchActions({ actions: actionListFromResourceV3(base["@id"], resource) }));
  put({ ...base, collections: [{ "@id": "https://example.org/sub", "@type": "sc:Collection", label: "Sub" }] });
  put({ ...base, collections: [] });
  expect(vault.get<any>(base["@id"]).items).toEqual([]);
});

for (const version of [3, 4] as const)
  test(`an authoritative v3 page wins over a reference in Vault${version}`, () => {
    const vault = version === 3 ? new Vault() : new Vault4();
    const actions = version === 3 ? actionListFromResourceV3 : actionListFromResourceV4;
    const pageId = "https://example.org/duplicate-page";
    const put = (id: string, resource: object) => vault.dispatch(batchActions({ actions: actions(id, resource) }));
    put(pageId, {
      id: pageId,
      type: "AnnotationPage",
      items: [
        {
          id: `${pageId}/old`,
          type: "Annotation",
          motivation: "commenting",
          body: { type: "TextualBody", value: "Old" },
          target: "https://example.org/c1",
        },
      ],
    });
    const id = "https://example.org/duplicates";
    put(id, {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id,
      type: "Manifest",
      items: [
        {
          id: "https://example.org/c1",
          type: "Canvas",
          width: 100,
          height: 100,
          items: [],
          annotations: [{ id: pageId, type: "AnnotationPage", items: [] }],
        },
        {
          id: "https://example.org/c2",
          type: "Canvas",
          width: 100,
          height: 100,
          items: [],
          annotations: [{ id: pageId, type: "AnnotationPage" }],
        },
      ],
    });
    expect((vault instanceof Vault4 ? vault.get<any>(pageId) : vault.get<any>(pageId)).items).toEqual([]);
  });

describe.each(["Canvas", "Timeline"] as const)("%s media-fragment references", (type) => {
  test("loading a timed supplementary page preserves loaded content and metadata", () => {
    const vault = new Vault4();
    const id = `https://example.org/${type.toLowerCase()}/track`;
    vault.loadSync(id, {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id,
      type,
      duration: 98.25,
      width: 100,
      height: 100,
      label: { en: ["Side A"] },
      items: [{ id: `${id}/painting`, type: "AnnotationPage", items: [] }],
    } as any);
    const pageId = `${id}/lyrics`;
    vault.loadSync(pageId, {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: pageId,
      type: "AnnotationPage",
      items: [
        {
          id: `${pageId}/line`,
          type: "Annotation",
          motivation: ["supplementing"],
          body: { type: "TextualBody", value: "Lyrics", language: ["de"] },
          target: { id: `${id}#t=8,10`, type },
        },
      ],
    });
    expect(vault.get<any>(id)).toMatchObject({ duration: 98.25, label: { en: ["Side A"] } });
    expect(vault.get<any>(id).items).toHaveLength(1);
    const annotation = vault.get<any>(`${pageId}/line`);
    const target = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;
    expect(target.source).toMatchObject({ id, type });
    expect(target.selector).toContainEqual({ type: "FragmentSelector", value: "t=8,10" });
    vault.dispatch(
      batchActions({
        actions: actionListFromResourceV4(id, {
          "@context": "http://iiif.io/api/presentation/4/context.json",
          id,
          type,
          duration: 0,
          items: [],
          label: null,
        }),
      })
    );
    expect(vault.get<any>(id)).toMatchObject({ duration: 0, items: [], label: null });
  });
});
