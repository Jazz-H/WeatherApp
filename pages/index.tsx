import Head from "next/head";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import UnitToggle from "../components/UnitToggle";
import CurrentConditions from "../components/CurrentConditions";
import HourlyStrip from "../components/HourlyStrip";
import DailyOutlook from "../components/DailyOutlook";
import RecommendationHero from "../components/RecommendationHero";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { skyThemeFor } from "../lib/skyTheme";
import {
  fetchForecast,
  geocodeCity,
  locationFromCoords,
} from "../lib/openMeteo";
import { reverseGeocode } from "../lib/reverseGeocode";
import { unitsForCountry, unitsFromLocale } from "../lib/units";
import { buildPromptPayload } from "../lib/forecastToPrompt";
import type { Forecast, GeoLocation, Units } from "../types/weather";
import type { Recommendation } from "../lib/recommendationSchema";

const UNITS_KEY = "clearcast:units";
const UNITS_MANUAL_KEY = "clearcast:units-manual";
type Status = "idle" | "loading" | "ready" | "error";
type RecStatus = "idle" | "loading" | "ready" | "unavailable";

// Read the stored unit preference. `manual` is true only once the user has
// explicitly used the toggle — until then units auto-follow the location.
function readUnitPref(): { units: Units | null; manual: boolean } {
  if (typeof window === "undefined") return { units: null, manual: false };
  const manual = window.localStorage.getItem(UNITS_MANUAL_KEY) === "true";
  const stored = window.localStorage.getItem(UNITS_KEY);
  return {
    units: stored === "imperial" || stored === "metric" ? stored : null,
    manual,
  };
}

function unitsForLocation(loc: GeoLocation): Units {
  const pref = readUnitPref();
  if (pref.manual && pref.units) return pref.units; // respect explicit choice
  if (loc.country) return unitsForCountry(loc.country);
  return unitsFromLocale(
    typeof navigator !== "undefined" ? navigator.language : undefined
  );
}

export default function Home() {
  const [units, setUnits] = useState<Units>("imperial");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [recStatus, setRecStatus] = useState<RecStatus>("idle");

  // Restore a manual unit preference once, on the client (avoids hydration
  // mismatch). Auto-derived units are applied later when a location resolves.
  useEffect(() => {
    const pref = readUnitPref();
    if (pref.manual && pref.units) setUnits(pref.units);
  }, []);

  // Ask the serverless function for an AI recommendation. Failure here is
  // non-fatal: the forecast still renders without the hero.
  const fetchRecommendation = useCallback(async (data: Forecast) => {
    setRecStatus("loading");
    setRecommendation(null);
    try {
      const { data: body } = await axios.post("/api/summarize", {
        payload: buildPromptPayload(data),
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
      setRecommendation(body.recommendation);
      setRecStatus("ready");
    } catch {
      setRecStatus("unavailable");
    }
  }, []);

  const loadForecast = useCallback(
    async (loc: GeoLocation, u: Units) => {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchForecast(loc, u);
        setForecast(data);
        setLocation(loc);
        setStatus("ready");
        void fetchRecommendation(data);
      } catch {
        setStatus("error");
        setError("Couldn't load the forecast. Please try again.");
      }
    },
    [fetchRecommendation]
  );

  // Resolve the right units for this place (unless the user picked manually),
  // sync the toggle, then load the forecast.
  const loadForLocation = useCallback(
    async (loc: GeoLocation) => {
      const u = unitsForLocation(loc);
      setUnits(u);
      await loadForecast(loc, u);
    },
    [loadForecast]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setStatus("loading");
      setError(null);
      try {
        const matches = await geocodeCity(query);
        if (matches.length === 0) {
          setStatus("error");
          setError(`No match for "${query}". Try another city.`);
          return;
        }
        await loadForLocation(matches[0]);
      } catch {
        setStatus("error");
        setError("Search failed. Please try again.");
      }
    },
    [loadForLocation]
  );

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation isn't available. Search for a city instead.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse-geocode for a real city name + country (drives units);
        // fall back to bare coordinates if that lookup fails.
        let loc: GeoLocation;
        try {
          loc = await reverseGeocode(latitude, longitude);
        } catch {
          loc = locationFromCoords(latitude, longitude);
        }
        void loadForLocation(loc);
      },
      () => {
        setStatus("error");
        setError("Location access denied. Search for a city instead.");
      }
    );
  }, [loadForLocation]);

  // Try geolocation once on first load.
  useEffect(() => {
    handleUseLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnitsChange = (next: Units) => {
    setUnits(next);
    window.localStorage.setItem(UNITS_KEY, next);
    window.localStorage.setItem(UNITS_MANUAL_KEY, "true"); // explicit override
    if (location) void loadForecast(location, next);
  };

  const sky = skyThemeFor(forecast?.current);

  return (
    <>
      <Head>
        <title>Clearcast</title>
        <meta
          name="description"
          content="Clearcast turns the forecast into a plain-English plan for your day."
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#0f2027" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Clearcast" />
      </Head>

      <main
        className="min-h-screen px-4"
        style={{
          backgroundImage: sky.gradient,
          paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
        }}
      >
        <div className="max-w-[640px] mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Clearcast
              </h1>
            </div>
            <UnitToggle units={units} onChange={handleUnitsChange} />
          </header>

          <SearchBar onSearch={handleSearch} onUseLocation={handleUseLocation} />

          <div className="mt-6 space-y-6">
            {status === "loading" && <LoadingSkeleton />}

            {status === "error" && (
              <p
                role="alert"
                className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-100 px-4 py-3"
              >
                {error}
              </p>
            )}

            {status === "ready" && forecast && (
              <>
                {recStatus === "loading" && (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse text-white/60">
                    Reading the day for you…
                  </div>
                )}
                {recStatus === "ready" && recommendation && (
                  <RecommendationHero recommendation={recommendation} />
                )}
                {recStatus === "unavailable" && (
                  <p className="rounded-xl bg-white/5 border border-white/10 text-white/50 px-4 py-3 text-sm">
                    Recommendation unavailable right now — here&apos;s the
                    forecast.
                  </p>
                )}

                <CurrentConditions forecast={forecast} />
                <HourlyStrip forecast={forecast} />
                <DailyOutlook forecast={forecast} />
              </>
            )}

            {status === "idle" && (
              <p className="text-white/60 text-center py-10">
                Search a city or share your location to get started.
              </p>
            )}
          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}
