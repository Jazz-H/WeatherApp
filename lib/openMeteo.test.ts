import { describe, expect, it } from "vitest";
import {
  parseForecastResponse,
  parseGeocodingResponse,
} from "./openMeteo";
import type { GeoLocation } from "../types/weather";

describe("parseGeocodingResponse", () => {
  it("maps results to GeoLocation, preferring country over country_code", () => {
    const out = parseGeocodingResponse({
      results: [
        {
          name: "Charlotte",
          country: "United States",
          country_code: "US",
          admin1: "North Carolina",
          latitude: 35.22,
          longitude: -80.84,
          timezone: "America/New_York",
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      name: "Charlotte",
      country: "United States",
      admin1: "North Carolina",
      latitude: 35.22,
      longitude: -80.84,
    });
  });

  it("returns an empty array when there are no results", () => {
    expect(parseGeocodingResponse({})).toEqual([]);
  });
});

const location: GeoLocation = {
  name: "Charlotte",
  country: "US",
  latitude: 35.22,
  longitude: -80.84,
};

const rawForecast = {
  current: {
    time: "2026-06-22T14:00",
    temperature_2m: 78.3,
    apparent_temperature: 80.1,
    relative_humidity_2m: 55,
    weather_code: 2,
    wind_speed_10m: 7.4,
    precipitation: 0,
    is_day: 1,
  },
  hourly: {
    time: ["2026-06-22T14:00", "2026-06-22T15:00"],
    temperature_2m: [78, 79],
    precipitation_probability: [10, 20],
    weather_code: [2, 3],
    wind_speed_10m: [7, 8],
  },
  daily: {
    time: ["2026-06-22", "2026-06-23"],
    weather_code: [2, 61],
    temperature_2m_max: [82, 75],
    temperature_2m_min: [64, 60],
    precipitation_probability_max: [20, 80],
    sunrise: ["2026-06-22T06:12", "2026-06-23T06:13"],
    sunset: ["2026-06-22T20:35", "2026-06-23T20:35"],
  },
};

describe("parseForecastResponse", () => {
  it("maps the raw API shape into the Forecast domain model", () => {
    const f = parseForecastResponse(rawForecast, location, "imperial");
    expect(f.units).toBe("imperial");
    expect(f.location.name).toBe("Charlotte");
    expect(f.current.isDay).toBe(true);
    expect(f.current.temperature).toBe(78.3);
    expect(f.hourly).toHaveLength(2);
    expect(f.hourly[1]).toMatchObject({ temperature: 79, weatherCode: 3 });
    expect(f.daily).toHaveLength(2);
    expect(f.daily[1]).toMatchObject({
      tempMax: 75,
      tempMin: 60,
      precipitationProbabilityMax: 80,
    });
  });

  it("treats is_day = 0 as night", () => {
    const night = {
      ...rawForecast,
      current: { ...rawForecast.current, is_day: 0 },
    };
    expect(parseForecastResponse(night, location, "metric").current.isDay).toBe(
      false
    );
  });

  it("throws when the response is missing a section", () => {
    expect(() =>
      parseForecastResponse({ current: rawForecast.current }, location, "metric")
    ).toThrow(/incomplete/i);
  });
});
