import type { Forecast } from "../types/weather";
import { unitLabels } from "../types/weather";
import { getWeatherInfo } from "./weatherCodes";
import { upcomingHours } from "./format";

// The trimmed payload we actually send to the model. Per the brief, we send
// only the next ~12 hours of hourly data plus today's daily summary so we
// don't pay tokens for a full 7-day hourly blob.
export interface PromptPayload {
  location: string;
  units: { temperature: string; windSpeed: string };
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    conditions: string;
    windSpeed: number;
    precipitation: number;
    isDay: boolean;
  };
  next12Hours: {
    time: string;
    temperature: number;
    precipitationProbability: number;
    conditions: string;
    windSpeed: number;
  }[];
  today: {
    conditions: string;
    tempMax: number;
    tempMin: number;
    precipitationProbabilityMax: number;
    sunrise: string;
    sunset: string;
  } | null;
}

export function buildPromptPayload(
  forecast: Forecast,
  now: Date = new Date()
): PromptPayload {
  const labels = unitLabels(forecast.units);
  const place = [
    forecast.location.name,
    forecast.location.admin1,
    forecast.location.country,
  ]
    .filter(Boolean)
    .join(", ");

  const today = forecast.daily[0]
    ? {
        conditions: getWeatherInfo(forecast.daily[0].weatherCode).label,
        tempMax: forecast.daily[0].tempMax,
        tempMin: forecast.daily[0].tempMin,
        precipitationProbabilityMax:
          forecast.daily[0].precipitationProbabilityMax,
        sunrise: forecast.daily[0].sunrise,
        sunset: forecast.daily[0].sunset,
      }
    : null;

  return {
    location: place,
    units: { temperature: labels.temperature, windSpeed: labels.windSpeed },
    current: {
      time: forecast.current.time,
      temperature: forecast.current.temperature,
      apparentTemperature: forecast.current.apparentTemperature,
      humidity: forecast.current.humidity,
      conditions: getWeatherInfo(forecast.current.weatherCode).label,
      windSpeed: forecast.current.windSpeed,
      precipitation: forecast.current.precipitation,
      isDay: forecast.current.isDay,
    },
    next12Hours: upcomingHours(forecast.hourly, 12, now).map((h) => ({
      time: h.time,
      temperature: h.temperature,
      precipitationProbability: h.precipitationProbability,
      conditions: getWeatherInfo(h.weatherCode).label,
      windSpeed: h.windSpeed,
    })),
    today,
  };
}

// Cache key per the brief: lat,lon,YYYY-MM-DD-HH so we don't re-call the model
// on every refresh within the same hour. Coordinates are rounded to ~1km to
// improve the hit rate for nearby lookups.
// FNV-1a, 32-bit. A hand-rolled hash rather than node:crypto because this
// module is also imported by the browser bundle (buildPromptPayload), where
// node:crypto is unavailable. It needs to be stable and fast, not
// cryptographic: its only job is to keep two different payloads out of the
// same cache slot.
function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload) ?? "null";
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function recommendationCacheKey(
  latitude: number,
  longitude: number,
  now: Date = new Date(),
  payload?: unknown
): string {
  const lat = latitude.toFixed(2);
  const lon = longitude.toFixed(2);
  const stamp = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const base = `${lat},${lon},${stamp}`;
  // The payload is supplied by the caller and is what the cached
  // recommendation actually describes, so it has to be part of the key.
  // Keying on location and hour alone let one client's payload decide what
  // every later visitor to that location saw for the rest of the hour.
  return payload === undefined ? base : `${base},${hashPayload(payload)}`;
}
