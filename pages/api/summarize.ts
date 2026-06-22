import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  RecommendationSchema,
  type Recommendation,
} from "../../lib/recommendationSchema";
import { recommendationCacheKey } from "../../lib/forecastToPrompt";

// This route runs server-side ONLY and is the single place the Claude API key
// is used. It must never be exposed to the browser.

const SYSTEM_PROMPT =
  "You turn raw weather forecast data into a short, friendly recommendation about " +
  "what the user can do today. Be specific and decisive. Recommend what to wear and " +
  "which activities are good, ok, or worth skipping, and the best time window. " +
  "Never just restate the raw numbers — translate them into a decision. " +
  "Suggest 3-4 common activities (e.g. Run, Bike, Walk the dog, Wash the car).";

// In-memory cache keyed by lat,lon,YYYY-MM-DD-HH. Per the brief this avoids
// re-calling the model on every refresh. It's per-instance and resets on cold
// starts — fine for a portfolio demo; swap for Vercel KV/Redis to make durable.
const cache = new Map<string, Recommendation>();
const MAX_CACHE_ENTRIES = 500;

// Daily call cap — bounds cost no matter the traffic. Best-effort per warm
// instance. Configurable via env.
const MAX_CALLS_PER_DAY = Number(process.env.MAX_AI_CALLS_PER_DAY ?? 500);
let callsToday = 0;
let callWindow = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function withinDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== callWindow) {
    callWindow = today;
    callsToday = 0;
  }
  return callsToday < MAX_CALLS_PER_DAY;
}

type SummarizeBody = {
  payload?: unknown;
  latitude?: number;
  longitude?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { payload, latitude, longitude } = req.body as SummarizeBody;
  if (
    payload == null ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return res.status(400).json({ error: "Missing payload or coordinates" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Graceful degradation: the UI still shows the forecast without the hero.
    return res
      .status(503)
      .json({ error: "AI recommendations are not configured." });
  }

  const key = recommendationCacheKey(latitude, longitude);
  const cached = cache.get(key);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json({ recommendation: cached, cached: true });
  }

  if (!withinDailyCap()) {
    return res
      .status(429)
      .json({ error: "Daily recommendation limit reached. Try again later." });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Forecast JSON:\n${JSON.stringify(payload)}` },
      ],
      output_config: { format: zodOutputFormat(RecommendationSchema) },
    });

    const recommendation = response.parsed_output;
    if (!recommendation) {
      return res
        .status(502)
        .json({ error: "The model did not return a recommendation." });
    }

    callsToday += 1;
    if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
    cache.set(key, recommendation);

    res.setHeader("X-Cache", "MISS");
    return res.status(200).json({ recommendation, cached: false });
  } catch (err) {
    console.error("summarize error:", err);
    return res
      .status(502)
      .json({ error: "Couldn't generate a recommendation right now." });
  }
}
