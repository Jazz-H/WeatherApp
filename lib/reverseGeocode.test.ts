import { describe, expect, it } from "vitest";
import { parseReverseGeocode } from "./reverseGeocode";

describe("parseReverseGeocode", () => {
  it("maps city and country code into a GeoLocation", () => {
    const loc = parseReverseGeocode(
      {
        city: "Charlotte",
        principalSubdivision: "North Carolina",
        countryCode: "US",
      },
      35.22,
      -80.84
    );
    expect(loc).toMatchObject({
      name: "Charlotte",
      admin1: "North Carolina",
      country: "US",
      latitude: 35.22,
      longitude: -80.84,
    });
  });

  it("falls back through locality and region for the name", () => {
    expect(
      parseReverseGeocode({ locality: "Soho", countryCode: "GB" }, 51.5, -0.13)
        .name
    ).toBe("Soho");
    expect(
      parseReverseGeocode({ principalSubdivision: "Bavaria" }, 48.1, 11.6).name
    ).toBe("Bavaria");
  });

  it("uses a sensible default when nothing is named", () => {
    expect(parseReverseGeocode({}, 0, 0).name).toBe("Your location");
    expect(parseReverseGeocode({}, 0, 0).country).toBe("");
  });
});
