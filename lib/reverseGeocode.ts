import axios from "axios";
import type { GeoLocation } from "../types/weather";

// Open-Meteo's geocoding API is forward-only (name -> coords), so for browser
// geolocation we reverse-geocode the coordinates with BigDataCloud's free,
// no-key, CORS-enabled endpoint to recover a city name and country code.
const REVERSE_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

interface RawReverse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryCode?: string;
}

export function parseReverseGeocode(
  raw: RawReverse,
  latitude: number,
  longitude: number
): GeoLocation {
  const name =
    raw.city || raw.locality || raw.principalSubdivision || "Your location";
  return {
    name,
    admin1: raw.principalSubdivision || undefined,
    country: raw.countryCode ?? "",
    latitude,
    longitude,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeoLocation> {
  const { data } = await axios.get<RawReverse>(REVERSE_URL, {
    params: { latitude, longitude, localityLanguage: "en" },
  });
  return parseReverseGeocode(data, latitude, longitude);
}
