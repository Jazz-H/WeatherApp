import type { IconType } from "react-icons";
import {
  WiCloudy,
  WiDayCloudy,
  WiDaySunny,
  WiFog,
  WiNightAltCloudy,
  WiNightClear,
  WiRain,
  WiRainMix,
  WiShowers,
  WiSleet,
  WiSnow,
  WiSprinkle,
  WiThunderstorm,
} from "react-icons/wi";

export interface WeatherInfo {
  label: string;
  icon: IconType;
}

// WMO weather interpretation codes used by Open-Meteo.
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
const LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Severe thunderstorm",
};

function pickIcon(code: number, isDay: boolean): IconType {
  if (code === 0 || code === 1) return isDay ? WiDaySunny : WiNightClear;
  if (code === 2) return isDay ? WiDayCloudy : WiNightAltCloudy;
  if (code === 3) return WiCloudy;
  if (code === 45 || code === 48) return WiFog;
  if (code >= 51 && code <= 55) return WiSprinkle;
  if (code === 56 || code === 57 || code === 66 || code === 67) return WiSleet;
  if (code >= 61 && code <= 65) return WiRain;
  if (code >= 71 && code <= 77) return WiSnow;
  if (code === 80) return WiShowers;
  if (code === 81 || code === 82) return WiRain;
  if (code === 85 || code === 86) return WiSnow;
  if (code >= 95) return WiThunderstorm;
  return WiRainMix; // safe fallback for any unmapped code
}

export function getWeatherInfo(code: number, isDay = true): WeatherInfo {
  return {
    label: LABELS[code] ?? "Unknown",
    icon: pickIcon(code, isDay),
  };
}
