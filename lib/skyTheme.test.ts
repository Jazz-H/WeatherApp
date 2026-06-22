import { describe, expect, it } from "vitest";
import { skyCategory, skyThemeFor } from "./skyTheme";

describe("skyCategory", () => {
  it("distinguishes clear day from clear night", () => {
    expect(skyCategory({ weatherCode: 0, isDay: true })).toBe("clear-day");
    expect(skyCategory({ weatherCode: 0, isDay: false })).toBe("clear-night");
  });

  it("maps cloud, rain, snow, fog, and storm codes", () => {
    expect(skyCategory({ weatherCode: 2, isDay: true })).toBe("cloud-day");
    expect(skyCategory({ weatherCode: 3, isDay: false })).toBe("cloud-night");
    expect(skyCategory({ weatherCode: 63, isDay: true })).toBe("rain");
    expect(skyCategory({ weatherCode: 81, isDay: true })).toBe("rain");
    expect(skyCategory({ weatherCode: 73, isDay: true })).toBe("snow");
    expect(skyCategory({ weatherCode: 45, isDay: true })).toBe("fog");
    expect(skyCategory({ weatherCode: 95, isDay: true })).toBe("storm");
  });

  it("defaults to clear-night when there is no current data", () => {
    expect(skyCategory(undefined)).toBe("clear-night");
  });
});

describe("skyThemeFor", () => {
  it("returns a CSS gradient for the resolved category", () => {
    const theme = skyThemeFor({ weatherCode: 0, isDay: true });
    expect(theme.category).toBe("clear-day");
    expect(theme.gradient).toMatch(/^linear-gradient\(/);
  });
});
