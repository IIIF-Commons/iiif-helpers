import { describe, expect, test } from "vitest";
import { Vault } from "../../src/vault/vault";
import { Vault4 } from "../../src/vault/vault4";

describe("Vault4 load reports", () => {
  test("preserves the parser source version and diagnostics", () => {
    const manifestId = "https://example.org/iiif/manifest/diagnostics";
    const vault = new Vault4();
    vault.loadManifestSync(manifestId, {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: manifestId,
      type: "Manifest",
      label: { en: ["Diagnostics"] },
      items: [{ type: "Canvas", height: 1, width: 1, items: [] }],
    });

    expect(vault.getLoadReport(manifestId)).toMatchObject({
      sourceVersion: 4,
      diagnostics: [
        {
          code: "minted-id",
          severity: "warning",
          path: "$.items[0]",
          resourceType: "Canvas",
        },
      ],
    });
  });

  test("records source version for the default compatibility Vault", () => {
    const manifestId = "https://example.org/iiif/manifest/timeline-compatibility";
    const vault = new Vault();
    vault.loadManifestSync(manifestId, {
      "@context": "http://iiif.io/api/presentation/4/context.json",
      id: manifestId,
      type: "Manifest",
      label: { en: ["Timeline compatibility"] },
      items: [
        {
          id: "https://example.org/iiif/timeline/1",
          type: "Timeline",
          duration: 10,
          items: [],
        },
      ],
    });

    expect(vault.getLoadReport(manifestId)).toEqual({
      sourceVersion: 4,
      diagnostics: [],
    });
  });

  test("marks both requested and canonical identifiers ready after a URI mismatch", async () => {
    const requestedId = "https://example.org/iiif/requested";
    const canonicalId = "https://example.org/iiif/canonical";
    const vault = new Vault4({
      customFetcher: async () => ({
        "@context": "http://iiif.io/api/presentation/4/context.json",
        id: canonicalId,
        type: "Manifest",
        label: { en: ["Canonical resource"] },
        items: [],
      }),
    });

    const requested = await vault.loadManifest(requestedId);
    const canonical = await vault.loadManifest(canonicalId);

    expect(requested?.id).toBe(canonicalId);
    expect(canonical).toBe(requested);
    expect(vault.requestStatus(requestedId)).toMatchObject({
      loadingState: "RESOURCE_READY",
      resourceUri: canonicalId,
      uriMismatch: true,
    });
    expect(vault.requestStatus(canonicalId)).toMatchObject({
      loadingState: "RESOURCE_READY",
      resourceUri: canonicalId,
      uriMismatch: true,
    });
  });
});
