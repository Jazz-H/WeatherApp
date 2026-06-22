import { describe, expect, it } from "vitest";
import { regionFromLocale, unitsForCountry, unitsFromLocale } from "./units";

describe("unitsForCountry", () => {
  it("returns imperial for the US and its territories", () => {
    expect(unitsForCountry("US")).toBe("imperial");
    expect(unitsForCountry("PR")).toBe("imperial");
    expect(unitsForCountry("us")).toBe("imperial"); // case-insensitive
  });

  it("returns metric for everywhere else", () => {
    expect(unitsForCountry("GB")).toBe("metric");
    expect(unitsForCountry("DE")).toBe("metric");
    expect(unitsForCountry("JP")).toBe("metric");
  });

  it("defaults to metric when the country is unknown", () => {
    expect(unitsForCountry(undefined)).toBe("metric");
    expect(unitsForCountry("")).toBe("metric");
  });
});

describe("regionFromLocale", () => {
  it("extracts the region subtag", () => {
    expect(regionFromLocale("en-US")).toBe("US");
    expect(regionFromLocale("fr-FR")).toBe("FR");
    expect(regionFromLocale("zh-Hans-CN")).toBe("CN");
  });

  it("returns undefined when there's no region", () => {
    expect(regionFromLocale("en")).toBeUndefined();
    expect(regionFromLocale(undefined)).toBeUndefined();
  });
});

describe("unitsFromLocale", () => {
  it("maps US locales to imperial and others to metric", () => {
    expect(unitsFromLocale("en-US")).toBe("imperial");
    expect(unitsFromLocale("en-GB")).toBe("metric");
    expect(unitsFromLocale(undefined)).toBe("metric");
  });
});
