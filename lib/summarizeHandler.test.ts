/**
 * The /api/summarize request lifecycle: validation, caching, the daily cap and
 * the degradation paths. buildPayloadFor has its own tests in
 * summarizeRoute.test.ts; this covers the handler around it.
 *
 * Lives in lib/ rather than beside the route on purpose — Next treats every
 * .ts under pages/ as a route, and a test file there gets built and deployed
 * as a live endpoint.
 *
 * The route keeps its cache and day counter at module scope, so every test
 * re-imports the module to get clean state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Forecast, GeoLocation } from "../types/weather";
import type { Recommendation } from "./recommendationSchema";

const anthropic = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse: anthropic.parse };
  },
}));
vi.mock("@anthropic-ai/sdk/helpers/zod", () => ({
  zodOutputFormat: () => ({ type: "json_schema" }),
}));
vi.mock("./openMeteo", () => ({ fetchForecast: vi.fn() }));
vi.mock("./reverseGeocode", () => ({ reverseGeocode: vi.fn() }));

const LOCATION: GeoLocation = {
  name: "Charlotte",
  admin1: "North Carolina",
  country: "US",
  latitude: 35.227,
  longitude: -80.843,
};

const FORECAST: Forecast = {
  location: LOCATION,
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

const RECOMMENDATION: Recommendation = {
  headline: "Hot and clear — hydrate",
  summary: "A bright, hot afternoon. Keep water close.",
  activities: [{ name: "Run", verdict: "ok", reason: "Go early or late." }],
  bestWindow: "after 7pm",
};

type Captured = {
  statusCode: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
};

function mockRes(): NextApiResponse & { captured: Captured } {
  const captured: Captured = { statusCode: 0, body: {}, headers: {} };
  const res = {
    captured,
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      captured.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      captured.headers[name] = value;
    },
  };
  return res as unknown as NextApiResponse & { captured: Captured };
}

function req(body: unknown, method = "POST"): NextApiRequest {
  return { method, body } as NextApiRequest;
}

/** Fresh module, so the cache and day counter start empty. */
async function loadHandler() {
  vi.resetModules();
  const mod = await import("../pages/api/summarize");
  return mod.default;
}

const VALID = { latitude: 35.227, longitude: -80.843, units: "imperial" };

describe("/api/summarize", () => {
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    delete process.env.MAX_AI_CALLS_PER_DAY;

    const { fetchForecast } = await import("./openMeteo");
    const { reverseGeocode } = await import("./reverseGeocode");
    vi.mocked(reverseGeocode).mockResolvedValue(LOCATION);
    vi.mocked(fetchForecast).mockResolvedValue(FORECAST);
    anthropic.parse.mockResolvedValue({ parsed_output: RECOMMENDATION });

    // The route logs to console.error on its failure paths, which several
    // tests exercise deliberately. Stubbed so the suite output stays readable,
    // and so the logging itself can be asserted.
    errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorLog.mockRestore();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.MAX_AI_CALLS_PER_DAY;
  });

  // ---- method and input validation ----

  it("rejects anything but POST, and advertises what it allows", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(VALID, "GET"), res);
    expect(res.captured.statusCode).toBe(405);
    expect(res.captured.headers.Allow).toBe("POST");
  });

  it.each([
    ["missing coordinates", { units: "imperial" }],
    ["latitude as a string", { ...VALID, latitude: "35.2" }],
    ["latitude past the pole", { ...VALID, latitude: 91 }],
    ["longitude past the meridian", { ...VALID, longitude: -181 }],
    ["NaN latitude", { ...VALID, latitude: Number.NaN }],
    ["Infinity longitude", { ...VALID, longitude: Number.POSITIVE_INFINITY }],
  ])("rejects %s with a 400", async (_label, body) => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(body), res);
    expect(res.captured.statusCode).toBe(400);
    expect(res.captured.body.error).toBe("Invalid coordinates");
  });

  // Built from the coordinates rather than spread over VALID — VALID already
  // carries units, so spreading an empty object would not make them absent.
  const COORDS = { latitude: VALID.latitude, longitude: VALID.longitude };

  it.each([
    ["absent", COORDS],
    ["misspelled", { ...COORDS, units: "farenheit" }],
    ["not a string", { ...COORDS, units: 1 }],
    ["null", { ...COORDS, units: null }],
  ])("rejects units that are %s with a 400", async (_label, body) => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(body), res);
    expect(res.captured.statusCode).toBe(400);
    expect(res.captured.body.error).toBe("Invalid units");
  });

  it("never calls the model when validation fails", async () => {
    const handler = await loadHandler();
    await handler(req({ ...VALID, latitude: 500 }), mockRes());
    expect(anthropic.parse).not.toHaveBeenCalled();
  });

  // ---- graceful degradation ----

  it("returns 503 rather than failing when no API key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(VALID), res);
    // The UI treats this as "no hero" and still renders the forecast.
    expect(res.captured.statusCode).toBe(503);
    expect(anthropic.parse).not.toHaveBeenCalled();
  });

  // ---- the happy path ----

  it("returns a recommendation and marks it a cache miss", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(VALID), res);
    expect(res.captured.statusCode).toBe(200);
    expect(res.captured.body).toEqual({
      recommendation: RECOMMENDATION,
      cached: false,
    });
    expect(res.captured.headers["X-Cache"]).toBe("MISS");
    expect(anthropic.parse).toHaveBeenCalledTimes(1);
  });

  it("builds the prompt from its own forecast, not from the request", async () => {
    const handler = await loadHandler();
    await handler(req(VALID), mockRes());
    const { fetchForecast } = await import("./openMeteo");
    expect(fetchForecast).toHaveBeenCalledWith(LOCATION, "imperial");
    const sent = anthropic.parse.mock.calls[0][0];
    expect(sent.messages[0].content).toContain("Charlotte, North Carolina, US");
  });

  // ---- caching ----

  it("serves the second identical request from cache without calling the model", async () => {
    const handler = await loadHandler();
    await handler(req(VALID), mockRes());

    const second = mockRes();
    await handler(req(VALID), second);

    expect(second.captured.statusCode).toBe(200);
    expect(second.captured.body.cached).toBe(true);
    expect(second.captured.headers["X-Cache"]).toBe("HIT");
    expect(anthropic.parse).toHaveBeenCalledTimes(1);
  });

  it("does not let imperial and metric share a cache entry", async () => {
    // The units half of the cache-key fix, proven through the handler.
    const handler = await loadHandler();
    await handler(req(VALID), mockRes());

    const metric = mockRes();
    await handler(req({ ...VALID, units: "metric" }), metric);

    expect(metric.captured.headers["X-Cache"]).toBe("MISS");
    expect(anthropic.parse).toHaveBeenCalledTimes(2);
  });

  it("does not let a different location hit another's entry", async () => {
    const handler = await loadHandler();
    await handler(req(VALID), mockRes());

    const elsewhere = mockRes();
    await handler(
      req({ ...VALID, latitude: 47.6, longitude: -122.33 }),
      elsewhere
    );

    expect(elsewhere.captured.headers["X-Cache"]).toBe("MISS");
    expect(anthropic.parse).toHaveBeenCalledTimes(2);
  });

  // ---- the daily cap ----

  it("returns 429 once the daily cap is spent", async () => {
    process.env.MAX_AI_CALLS_PER_DAY = "1";
    const handler = await loadHandler();

    await handler(req(VALID), mockRes()); // spends the one call

    const second = mockRes();
    // A different location, so the cache cannot serve it.
    await handler(
      req({ ...VALID, latitude: 47.6, longitude: -122.33 }),
      second
    );

    expect(second.captured.statusCode).toBe(429);
    expect(anthropic.parse).toHaveBeenCalledTimes(1);
  });

  it("still serves cached entries after the cap is spent", async () => {
    // The cap guards model calls, not the cache — a capped day should not stop
    // returning work already paid for.
    process.env.MAX_AI_CALLS_PER_DAY = "1";
    const handler = await loadHandler();
    await handler(req(VALID), mockRes());

    const again = mockRes();
    await handler(req(VALID), again);

    expect(again.captured.statusCode).toBe(200);
    expect(again.captured.body.cached).toBe(true);
  });

  // ---- failure paths ----

  it("returns 502 when the model returns no parsed output", async () => {
    anthropic.parse.mockResolvedValue({ parsed_output: null });
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(VALID), res);
    expect(res.captured.statusCode).toBe(502);
  });

  it("returns 502 when the forecast fetch fails, and caches nothing", async () => {
    const { fetchForecast } = await import("./openMeteo");
    vi.mocked(fetchForecast).mockRejectedValue(new Error("open-meteo down"));
    const handler = await loadHandler();

    const first = mockRes();
    await handler(req(VALID), first);
    expect(first.captured.statusCode).toBe(502);

    // A failure must not be cached as if it were an answer.
    vi.mocked(fetchForecast).mockResolvedValue(FORECAST);
    const second = mockRes();
    await handler(req(VALID), second);
    expect(second.captured.statusCode).toBe(200);
    expect(second.captured.headers["X-Cache"]).toBe("MISS");
  });

  it("returns 502 when the model call throws", async () => {
    anthropic.parse.mockRejectedValue(new Error("overloaded"));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(req(VALID), res);
    expect(res.captured.statusCode).toBe(502);
    expect(res.captured.body.error).toBe(
      "Couldn't generate a recommendation right now."
    );
    // A 502 should leave a trace in the logs, not fail silently.
    expect(errorLog).toHaveBeenCalledWith(
      "summarize error:",
      expect.any(Error)
    );
  });

  it("does not spend a call from the daily cap when the model throws", async () => {
    // callsToday is incremented after a successful parse, so a failure should
    // leave the budget intact.
    process.env.MAX_AI_CALLS_PER_DAY = "1";
    anthropic.parse.mockRejectedValueOnce(new Error("overloaded"));
    const handler = await loadHandler();

    await handler(req(VALID), mockRes()); // fails, should cost nothing

    anthropic.parse.mockResolvedValue({ parsed_output: RECOMMENDATION });
    const second = mockRes();
    await handler(req(VALID), second);

    expect(second.captured.statusCode).toBe(200);
  });
});
