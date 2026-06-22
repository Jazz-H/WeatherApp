import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import UnitToggle from "../components/UnitToggle";
import CurrentConditions from "../components/CurrentConditions";
import HourlyStrip from "../components/HourlyStrip";
import DailyOutlook from "../components/DailyOutlook";
import Spinner from "../components/Spinner";
import {
  fetchForecast,
  geocodeCity,
  locationFromCoords,
} from "../lib/openMeteo";
import type { Forecast, GeoLocation, Units } from "../types/weather";

const UNITS_KEY = "clearcast:units";
type Status = "idle" | "loading" | "ready" | "error";

export default function Home() {
  const [units, setUnits] = useState<Units>("imperial");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Restore unit preference once, on the client (avoids hydration mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(UNITS_KEY);
    if (stored === "imperial" || stored === "metric") setUnits(stored);
  }, []);

  const loadForecast = useCallback(async (loc: GeoLocation, u: Units) => {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchForecast(loc, u);
      setForecast(data);
      setLocation(loc);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Couldn't load the forecast. Please try again.");
    }
  }, []);

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
        await loadForecast(matches[0], units);
      } catch {
        setStatus("error");
        setError("Search failed. Please try again.");
      }
    },
    [loadForecast, units]
  );

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation isn't available. Search for a city instead.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadForecast(
          locationFromCoords(pos.coords.latitude, pos.coords.longitude),
          units
        );
      },
      () => {
        setStatus("error");
        setError("Location access denied. Search for a city instead.");
      }
    );
  }, [loadForecast, units]);

  // Try geolocation once on first load.
  useEffect(() => {
    handleUseLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnitsChange = (next: Units) => {
    setUnits(next);
    window.localStorage.setItem(UNITS_KEY, next);
    if (location) void loadForecast(location, next);
  };

  return (
    <>
      <Head>
        <title>Clearcast — what can you do today?</title>
        <meta
          name="description"
          content="Clearcast turns the forecast into a plain-English plan for your day."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 px-4 py-8">
        <div className="max-w-[640px] mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Clearcast
            </h1>
            <UnitToggle units={units} onChange={handleUnitsChange} />
          </header>

          <SearchBar onSearch={handleSearch} onUseLocation={handleUseLocation} />

          <div className="mt-6 space-y-6">
            {status === "loading" && <Spinner />}

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
        </div>
      </main>
    </>
  );
}
