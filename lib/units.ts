import type { Units } from "../types/weather";

// Countries that conventionally use Fahrenheit for everyday temperature.
// Everywhere else defaults to metric (Celsius / km·h).
const FAHRENHEIT_COUNTRIES = new Set([
  "US", // United States
  "PR",
  "GU",
  "VI",
  "AS",
  "MP", // US territories
  "BS", // Bahamas
  "BZ", // Belize
  "KY", // Cayman Islands
  "PW", // Palau
  "FM", // Micronesia
  "MH", // Marshall Islands
]);

export function unitsForCountry(countryCode?: string | null): Units {
  if (!countryCode) return "metric";
  return FAHRENHEIT_COUNTRIES.has(countryCode.toUpperCase())
    ? "imperial"
    : "metric";
}

// Extract the region subtag from a BCP-47 locale, e.g. "en-US" -> "US".
export function regionFromLocale(locale?: string): string | undefined {
  if (!locale) return undefined;
  const parts = locale.split("-");
  // Region is the 2-letter (or 3-digit) subtag, usually last.
  for (let i = parts.length - 1; i >= 1; i--) {
    const p = parts[i];
    if (/^[A-Za-z]{2}$/.test(p) || /^\d{3}$/.test(p)) return p.toUpperCase();
  }
  return undefined;
}

// Fallback when we only have the browser locale (e.g. geolocation with no
// resolved country): guess the unit system from the locale's region.
export function unitsFromLocale(locale?: string): Units {
  return unitsForCountry(regionFromLocale(locale));
}
