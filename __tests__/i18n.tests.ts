/**
 * @jest-environment node
 */
import { buildLocaleString, getValue, getAvailableLanguagesFromResource, iiifString } from "../src/i18n";
import { describe, test, expect } from "vitest";
import delftExample from "../fixtures/exhibitions/novieten.json";
import compositeTest from "../fixtures/cookbook/composite.json";
import type { InternationalString } from "@iiif/presentation-3";

describe("i18n helper", () => {
  describe("buildLocaleString()", () => {
    test("get value works on node", () => {
      expect(getValue({ en: ["Testing a value"] })).toEqual("Testing a value");
      expect(getValue({ none: ["Testing a value"] })).toEqual("Testing a value");
      expect(getValue({ es: ["Testing a value"] })).toEqual("Testing a value");
      expect(getValue({ en: ["This value instead"], es: ["Testing a value"] })).toEqual("This value instead");
      expect(getValue({ es: ["Testing a value"], en: ["This value instead"] })).toEqual("This value instead");
      expect(getValue({ en: [""], nl: ["Testing a value"] })).toEqual("Testing a value");
    });

    test("it can empty values", () => {
      expect(buildLocaleString(null, "none")).toEqual("");
      expect(buildLocaleString(undefined, "none")).toEqual("");
      expect(buildLocaleString({}, "none")).toEqual("");
      expect(buildLocaleString("", "none")).toEqual("");
    });

    test("it can match exact languages", () => {
      expect(buildLocaleString({ none: ["A"] }, "none")).toEqual("A");
      expect(buildLocaleString({ en: ["A"] }, "en")).toEqual("A");
      expect(buildLocaleString({ "en-GB": ["A"] }, "en-GB")).toEqual("A");
      expect(buildLocaleString({ DIFF: ["_"], none: ["A"] }, "none")).toEqual("A");
      expect(buildLocaleString({ en: ["A"], DIFF: ["_"] }, "en")).toEqual("A");
      expect(buildLocaleString({ DIFF: ["_"], "en-GB": ["A"] }, "en-GB")).toEqual("A");
    });

    test("it can match partial languages", () => {
      expect(buildLocaleString({ en: ["A"], none: ["_"] }, "en-GB")).toEqual("A");
      expect(buildLocaleString({ en: ["A"], none: ["_"] }, "en-US")).toEqual("A");
      expect(buildLocaleString({ "en-GB": ["A"], none: ["_"] }, "en")).toEqual("A");
      expect(buildLocaleString({ "en-US": ["A"], none: ["_"] }, "en")).toEqual("A");
    });

    test("wont match partial, if strict", () => {
      expect(buildLocaleString({ "en-GB": ["A"], none: ["A"] }, "en", { strictFallback: true })).toEqual("A");
      expect(buildLocaleString({ "en-US": ["A"], none: ["A"] }, "en", { strictFallback: true })).toEqual("A");
    });

    test("it can match fallback languages", () => {
      expect(buildLocaleString({ en: ["A"], none: ["_"] }, "cy-GB", { fallbackLanguages: ["en-GB"] })).toEqual("A");
      expect(buildLocaleString({ en: ["_"], none: ["A"] }, "cy-GB", { fallbackLanguages: [] })).toEqual("A");
      expect(buildLocaleString({ en: ["_"], none: ["A"], "@none": ["_"] }, "cy-GB", { fallbackLanguages: [] })).toEqual(
        "A",
      );
      expect(buildLocaleString({ en: ["_"], "@none": ["A"] }, "cy-GB", { fallbackLanguages: [] })).toEqual("A");
    });

    test("multiple values with separators", () => {
      expect(buildLocaleString({ none: ["A", "B"] }, "none")).toEqual("A\nB");
      expect(buildLocaleString({ none: ["A", "B"] }, "none", { separator: "" })).toEqual("AB");
      expect(buildLocaleString({ none: ["A", "B"] }, "none", { separator: "<br/>" })).toEqual("A<br/>B");
      expect(buildLocaleString({ none: ["A", "B", "C", "D", "E"] }, "none", { separator: " " })).toEqual("A B C D E");
    });
  });

  describe("getAvailableLanguagesFromResource()", () => {
    test("it can get languages from a resource", () => {
      const found = getAvailableLanguagesFromResource({
        id: "http://example.com/iiif/book1/canvas/p1",
        type: "Canvas",
        label: { en: ["p. 1"], fr: ["p. 1"] },
        height: 1000,
        width: 750,
      });
      expect(found).toHaveLength(2);
      expect(found).toContain("en");
      expect(found).toContain("fr");
    });

    test("it can get languages from a resource with nested values", () => {
      const found = getAvailableLanguagesFromResource(delftExample as any);
      expect(found).toHaveLength(2);
      expect(found).toContain("en");
      expect(found).toContain("nl");
    });

    test("it will skip none languages", () => {
      const found = getAvailableLanguagesFromResource({
        id: "http://example.com/iiif/book1/canvas/p1",
        type: "Canvas",
        label: { none: ["p. 1"], fr: ["p. 1"] },
        height: 1000,
        width: 750,
      });

      expect(found).toHaveLength(1);
      expect(found).not.toContain("none");
      expect(found).toContain("fr");
    });

    test("it can get languages from a composite resource", () => {
      const found = getAvailableLanguagesFromResource(compositeTest as any);

      expect(found).toHaveLength(2);
      expect(found).toContain("en");
      expect(found).toContain("fr");
    });
  });

  describe("String concat", () => {
    test("Simple case with single language", () => {
      const label = { en: ["An english label"] };
      const summary = { en: ["An english summary"] };

      expect(iiifString`Label: ${label}, Summary: ${summary}`).toEqual(
        "Label: An english label, Summary: An english summary",
      );
    });

    test("Simple case with preferred language", () => {
      const label: InternationalString = { fr: ["A French label"] };

      expect(iiifString`Label: ${label.en || label}`).toEqual("Label: A French label");
    });
  });
});
