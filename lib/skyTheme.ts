// "Adaptive Sky" — the background shifts with the current conditions and
// whether it's day or night, giving Clearcast its own weather-native identity.
// Gradients are tuned mid-to-deep so white text stays readable over them.

export type SkyCategory =
  | "clear-day"
  | "clear-night"
  | "cloud-day"
  | "cloud-night"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

export interface SkyTheme {
  category: SkyCategory;
  gradient: string; // CSS linear-gradient(...)
}

export function skyCategory(
  current?: { weatherCode: number; isDay: boolean }
): SkyCategory {
  if (!current) return "clear-night";
  const { weatherCode: c, isDay } = current;
  if (c >= 95) return "storm";
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
  if (c === 45 || c === 48) return "fog";
  if (c >= 2) return isDay ? "cloud-day" : "cloud-night";
  return isDay ? "clear-day" : "clear-night";
}

const GRADIENTS: Record<SkyCategory, string> = {
  "clear-day": "linear-gradient(to bottom, #1466a8 0%, #2f8fcf 55%, #3f9bd6 100%)",
  "clear-night": "linear-gradient(to bottom, #0f2027 0%, #203a43 60%, #2c5364 100%)",
  "cloud-day": "linear-gradient(to bottom, #355c7d 0%, #4a7fa0 60%, #5b90ad 100%)",
  "cloud-night": "linear-gradient(to bottom, #1a2433 0%, #243244 60%, #2c3e50 100%)",
  fog: "linear-gradient(to bottom, #4a525e 0%, #353c47 60%, #2b313a 100%)",
  rain: "linear-gradient(to bottom, #2b3a47 0%, #1f2d39 60%, #16202a 100%)",
  snow: "linear-gradient(to bottom, #5b7088 0%, #44586b 60%, #2f3e4f 100%)",
  storm: "linear-gradient(to bottom, #2c3540 0%, #1a222b 60%, #11181f 100%)",
};

export function skyThemeFor(
  current?: { weatherCode: number; isDay: boolean }
): SkyTheme {
  const category = skyCategory(current);
  return { category, gradient: GRADIENTS[category] };
}
