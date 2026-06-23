import axios from "axios";
import type {
  CurrentConditions,
  DailyPoint,
  Forecast,
  GeoLocation,
  HourlyPoint,
  Units,
} from "../types/weather";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// ----- Geocoding -----------------------------------------------------------

interface RawGeocodingResult {
  name: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface RawGeocodingResponse {
  results?: RawGeocodingResult[];
}

export function parseGeocodingResponse(
  raw: RawGeocodingResponse
): GeoLocation[] {
  return (raw.results ?? []).map((r) => ({
    name: r.name,
    country: r.country_code ?? r.country ?? "",
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

export async function geocodeCity(
  name: string,
  count = 5
): Promise<GeoLocation[]> {
  const { data } = await axios.get<RawGeocodingResponse>(GEOCODING_URL, {
    params: { name, count, language: "en", format: "json" },
  });
  return parseGeocodingResponse(data);
}

// ----- Forecast ------------------------------------------------------------

interface RawForecastResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

function parseCurrent(
  raw: NonNullable<RawForecastResponse["current"]>
): CurrentConditions {
  return {
    time: raw.time,
    temperature: raw.temperature_2m,
    apparentTemperature: raw.apparent_temperature,
    humidity: raw.relative_humidity_2m,
    weatherCode: raw.weather_code,
    windSpeed: raw.wind_speed_10m,
    precipitation: raw.precipitation,
    isDay: raw.is_day === 1,
  };
}

function parseHourly(
  raw: NonNullable<RawForecastResponse["hourly"]>
): HourlyPoint[] {
  return raw.time.map((time, i) => ({
    time,
    temperature: raw.temperature_2m[i],
    precipitationProbability: raw.precipitation_probability[i],
    weatherCode: raw.weather_code[i],
    windSpeed: raw.wind_speed_10m[i],
  }));
}

function parseDaily(
  raw: NonNullable<RawForecastResponse["daily"]>
): DailyPoint[] {
  return raw.time.map((date, i) => ({
    date,
    weatherCode: raw.weather_code[i],
    tempMax: raw.temperature_2m_max[i],
    tempMin: raw.temperature_2m_min[i],
    precipitationProbabilityMax: raw.precipitation_probability_max[i],
    sunrise: raw.sunrise[i],
    sunset: raw.sunset[i],
  }));
}

export function parseForecastResponse(
  raw: RawForecastResponse,
  location: GeoLocation,
  units: Units
): Forecast {
  if (!raw.current || !raw.hourly || !raw.daily) {
    throw new Error("Incomplete forecast response from Open-Meteo");
  }
  return {
    location,
    units,
    current: parseCurrent(raw.current),
    hourly: parseHourly(raw.hourly),
    daily: parseDaily(raw.daily),
  };
}

export async function fetchForecast(
  location: GeoLocation,
  units: Units
): Promise<Forecast> {
  const { data } = await axios.get<RawForecastResponse>(FORECAST_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day",
      hourly:
        "temperature_2m,precipitation_probability,weather_code,wind_speed_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
      timezone: "auto",
      forecast_days: 7,
      temperature_unit: units === "imperial" ? "fahrenheit" : "celsius",
      wind_speed_unit: units === "imperial" ? "mph" : "kmh",
    },
  });
  return parseForecastResponse(data, location, units);
}

// Reverse-friendly helper: build a minimal GeoLocation from raw coordinates
// (used when the browser geolocation API gives us lat/lon directly).
export function locationFromCoords(
  latitude: number,
  longitude: number
): GeoLocation {
  return { name: "Your location", country: "", latitude, longitude };
}
