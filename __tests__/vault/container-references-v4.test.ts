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
