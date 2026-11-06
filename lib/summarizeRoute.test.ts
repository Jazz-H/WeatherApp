/**
 * buildPayloadFor is the part of /api/summarize that replaced the
 * client-supplied `payload`. Its two upstream calls cannot run in CI, so they
 * are mocked and the branching is asserted directly.
 *
 * Lives in lib/ rather than beside the route: Next treats every .ts under
 * pages/ as a route, so pages/api/summarize.test.ts was built and deployed as
 * a live /api/summarize.test endpoint.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Forecast, GeoLocation } from "../types/weather";

vi.mock("./openMeteo", () => ({ fetchForecast: vi.fn() }));
vi.mock("./reverseGeocode", () => ({ reverseGeocode: vi.fn() }));

import { fetchForecast } from "./openMeteo";
import { reverseGeocode } from "./reverseGeocode";
import { buildPayloadFor } from "../pages/api/summarize";

const CHARLOTTE: GeoLocation = {
  name: "Charlotte",
  admin1: "North Carolina",
  country: "US",
  latitude: 35.227,
  longitude: -80.843,
};

function forecastFor(location: GeoLocation): Forecast {
  return {
    location,
    units: "imperial",
    current: {
      time: "2026-06-22T12:00",
      temperature: 88,
      apparentTemperature: 93,
      humidity: 60,
      weatherCode: 0,
      windSpeed: 7,
      precipitation: 0,
      isDay: true,
    },
    hourly: [
      {
        time: "2026-06-22T13:00",
        temperature: 90,
        precipitationProbability: 10,
        weatherCode: 0,
        windSpeed: 8,
      },
    ],
    daily: [
      {
        date: "2026-06-22",
        tempMax: 92,
        tempMin: 71,
        precipitationProbabilityMax: 20,
        weatherCode: 0,
        sunrise: "2026-06-22T06:12",
        sunset: "2026-06-22T20:35",
      },
    ],
  };
}

describe("buildPayloadFor", () => {
  beforeEach(() => {
    vi.mocked(reverseGeocode).mockReset();
    vi.mocked(fetchForecast).mockReset();
  });

  it("fetches the forecast for the coordinates and units it was given", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(CHARLOTTE);
    vi.mocked(fetchForecast).mockResolvedValue(forecastFor(CHARLOTTE));

    await buildPayloadFor(35.227, -80.843, "metric");

    expect(reverseGeocode).toHaveBeenCalledWith(35.227, -80.843);
    expect(fetchForecast).toHaveBeenCalledWith(CHARLOTTE, "metric");
  });

  it("puts the reverse-geocoded place into the payload", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(CHARLOTTE);
    vi.mocked(fetchForecast).mockResolvedValue(forecastFor(CHARLOTTE));

    const payload = await buildPayloadFor(35.227, -80.843, "imperial");

    expect(payload.location).toBe("Charlotte, North Carolina, US");
  });

  it("still returns a payload when the reverse geocode fails", async () => {
    // Losing the place name should cost the prompt some context, not the
    // whole recommendation.
    vi.mocked(reverseGeocode).mockRejectedValue(new Error("geocoder down"));
    const anonymous: GeoLocation = {
      name: "",
      country: "",
      latitude: 35.227,
      longitude: -80.843,
    };
    vi.mocked(fetchForecast).mockResolvedValue(forecastFor(anonymous));

    const payload = await buildPayloadFor(35.227, -80.843, "imperial");

    expect(payload.location).toBe("");
    expect(payload.current.temperature).toBe(88);
    // and it still fetched the forecast, using the coordinates it was given
    expect(vi.mocked(fetchForecast).mock.calls[0][0]).toMatchObject({
      latitude: 35.227,
      longitude: -80.843,
    });
  });

  it("propagates a forecast failure rather than inventing a payload", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(CHARLOTTE);
    vi.mocked(fetchForecast).mockRejectedValue(new Error("open-meteo down"));

    await expect(buildPayloadFor(35.227, -80.843, "imperial")).rejects.toThrow(
      "open-meteo down"
    );
  });
});
