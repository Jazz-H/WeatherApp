import { describe, expect, it } from "vitest";
import {
  buildPromptPayload,
  recommendationCacheKey,
} from "./forecastToPrompt";
import type { Forecast } from "../types/weather";

function makeForecast(): Forecast {
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    time: `2026-06-22T${String(i).padStart(2, "0")}:00`,
    temperature: 70 + i,
    precipitationProbability: i,
    weatherCode: 0,
    windSpeed: 5,
  }));
  return {
    location: {
      name: "Charlotte",
      admin1: "North Carolina",
      country: "US",
      latitude: 35.227,
      longitude: -80.843,
    },
    units: "imperial",
    current: {
      time: "2026-06-22T12:00",
      temperature: 78,
      apparentTemperature: 80,
      humidity: 50,
      weatherCode: 2,
      windSpeed: 6,
      precipitation: 0,
      isDay: true,
    },
    hourly,
    daily: [
      {
        date: "2026-06-22",
        weatherCode: 61,
        tempMax: 85,
        tempMin: 64,
        precipitationProbabilityMax: 40,
        sunrise: "2026-06-22T06:12",
        sunset: "2026-06-22T20:35",
      },
    ],
  };
}

describe("buildPromptPayload", () => {
  const now = new Date("2026-06-22T12:00:00Z");

  it("trims hourly data to the next 12 hours", () => {
    const payload = buildPromptPayload(makeForecast(), now);
    expect(payload.next12Hours).toHaveLength(12);
    // Starts at or after `now`, not at the top of the list.
    expect(payload.next12Hours[0].time).toBe("2026-06-22T12:00");
  });

  it("maps weather codes to human-readable conditions", () => {
    const payload = buildPromptPayload(makeForecast(), now);
    expect(payload.current.conditions).toBe("Partly cloudy");
    expect(payload.today?.conditions).toBe("Light rain");
  });

  it("builds a readable location string and carries today's summary", () => {
    const payload = buildPromptPayload(makeForecast(), now);
    expect(payload.location).toBe("Charlotte, North Carolina, US");
    expect(payload.today).toMatchObject({ tempMax: 85, tempMin: 64 });
    expect(payload.units).toEqual({ temperature: "°F", windSpeed: "mph" });
  });
});

describe("recommendationCacheKey", () => {
  it("keys by rounded coordinates and the current hour", () => {
    const now = new Date("2026-06-22T12:34:56Z");
    expect(recommendationCacheKey(35.227, -80.843, now)).toBe(
      "35.23,-80.84,2026-06-22T12"
    );
  });

  it("changes on the hour boundary but not within the same hour", () => {
    const a = recommendationCacheKey(35.23, -80.84, new Date("2026-06-22T12:05:00Z"));
    const b = recommendationCacheKey(35.23, -80.84, new Date("2026-06-22T12:55:00Z"));
    const c = recommendationCacheKey(35.23, -80.84, new Date("2026-06-22T13:01:00Z"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
