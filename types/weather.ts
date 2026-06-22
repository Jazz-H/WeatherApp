// Domain types for the Open-Meteo data layer (Phase 1).
// These replace the previous OpenWeatherMap response shape.

export type Units = "imperial" | "metric";

export interface GeoLocation {
  name: string;
  country: string;
  admin1?: string; // state / region, when available
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentConditions {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
}

export interface DailyPoint {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbabilityMax: number;
  sunrise: string;
  sunset: string;
}

export interface Forecast {
  location: GeoLocation;
  units: Units;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

// Unit labels for display.
export interface UnitLabels {
  temperature: string; // "°F" | "°C"
  windSpeed: string; // "mph" | "km/h"
}

export function unitLabels(units: Units): UnitLabels {
  return units === "imperial"
    ? { temperature: "°F", windSpeed: "mph" }
    : { temperature: "°C", windSpeed: "km/h" };
}
