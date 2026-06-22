import { describe, expect, it } from "vitest";
import { getWeatherInfo } from "./weatherCodes";
import { WiDaySunny, WiNightClear } from "react-icons/wi";

describe("getWeatherInfo", () => {
  it("returns the WMO label for a known code", () => {
    expect(getWeatherInfo(0).label).toBe("Clear sky");
    expect(getWeatherInfo(95).label).toBe("Thunderstorm");
  });

  it("swaps the clear-sky icon between day and night", () => {
    expect(getWeatherInfo(0, true).icon).toBe(WiDaySunny);
    expect(getWeatherInfo(0, false).icon).toBe(WiNightClear);
  });

  it("falls back gracefully for an unknown code", () => {
    const info = getWeatherInfo(1234);
    expect(info.label).toBe("Unknown");
    expect(info.icon).toBeTypeOf("function");
  });
});
