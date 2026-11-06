/**
 * Before/after comparison for the Haiku 4.5 -> 5.5 migration.
 *
 * Skipped unless ANTHROPIC_API_KEY is set, so it never runs in CI. To run it:
 *
 *   ANTHROPIC_API_KEY=sk-ant-... yarn vitest run modelComparison
 *
 * It makes real, billed API calls — three arms over four forecasts, twelve
 * calls of a few hundred tokens each, so cents rather than dollars. It asserts
 * that every arm still satisfies RecommendationSchema, and prints the
 * recommendations side by side with tokens, latency and cost, so the quality
 * tradeoff can be read rather than assumed.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import type { PromptPayload } from "./forecastToPrompt";
import { RecommendationSchema } from "./recommendationSchema";
import { SYSTEM_PROMPT } from "../pages/api/summarize";

// Published rates, $ per million tokens. Haiku 5.5's input rate applies up to
// 100K-token prompts; these are a few hundred tokens.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
};

type Arm = {
  label: string;
  model: string;
  // Kept as narrow fields rather than a spreadable params object: `effort` has
  // to merge into output_config alongside `format`, and spreading a whole
  // output_config would replace the schema and silently drop structured output.
  thinking?: { type: "disabled" };
  effort?: "low" | "medium" | "high";
};

const ARMS: Arm[] = [
  { label: "4.5 (current)", model: "claude-haiku-4-5" },
  // Closest like-for-like: on Haiku 4.5 this route runs no thinking at all,
  // since it passes no budget_tokens.
  {
    label: "5.5 no-thinking",
    model: "claude-haiku-5-5",
    thinking: { type: "disabled" },
  },
  // Haiku 5.5's own default is adaptive thinking at medium effort; low is the
  // cheapest on-setting, worth seeing in case the reasoning reads better.
  { label: "5.5 adaptive/low", model: "claude-haiku-5-5", effort: "low" },
];

function payload(
  location: string,
  conditions: string,
  temp: number,
  rainPct: number,
  wind: number
): PromptPayload {
  return {
    location,
    units: { temperature: "F", windSpeed: "mph" },
    current: {
      time: "2026-06-22T14:00",
      temperature: temp,
      apparentTemperature: temp + 3,
      humidity: 55,
      conditions,
      windSpeed: wind,
      precipitation: rainPct > 50 ? 0.2 : 0,
      isDay: true,
    },
    next12Hours: Array.from({ length: 6 }, (_, i) => ({
      time: `2026-06-22T${String(15 + i).padStart(2, "0")}:00`,
      temperature: temp - i,
      precipitationProbability: rainPct,
      conditions,
      windSpeed: wind,
    })),
    today: {
      conditions,
      tempMax: temp + 4,
      tempMin: temp - 15,
      precipitationProbabilityMax: rainPct,
      sunrise: "2026-06-22T06:12",
      sunset: "2026-06-22T20:35",
    },
  };
}

const CASES = [
  { name: "hot and clear", p: payload("Charlotte, NC", "Clear sky", 94, 5, 4) },
  {
    name: "rain all day",
    p: payload("Seattle, WA", "Moderate rain", 54, 85, 12),
  },
  {
    name: "cold and windy",
    p: payload("Minneapolis, MN", "Overcast", 21, 10, 24),
  },
  {
    name: "mild, late showers",
    p: payload("Austin, TX", "Partly cloudy", 72, 45, 8),
  },
];

const RULE = "=".repeat(72);

describe.skipIf(!process.env.ANTHROPIC_API_KEY)(
  "Haiku 4.5 vs 5.5 recommendation quality",
  () => {
    it("every arm returns a schema-valid recommendation", async () => {
      // Constructed here rather than in the describe body: the describe
      // callback still runs when skipped, and `new Anthropic()` throws
      // without a key.
      const client = new Anthropic();
      const lines: string[] = [];
      let cheapest = Infinity;
      let dearest = 0;

      for (const c of CASES) {
        lines.push(`\n${RULE}\n${c.name.toUpperCase()}  (${c.p.location})`);

        for (const arm of ARMS) {
          const started = Date.now();
          const response = await client.messages.parse({
            model: arm.model,
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Forecast JSON:\n${JSON.stringify(c.p)}`,
              },
            ],
            output_config: {
              format: zodOutputFormat(RecommendationSchema),
              ...(arm.effort ? { effort: arm.effort } : {}),
            },
            ...(arm.thinking ? { thinking: arm.thinking } : {}),
          });
          const ms = Date.now() - started;

          const rec = response.parsed_output;
          expect(
            rec,
            `${arm.label} / ${c.name} returned no recommendation`
          ).toBeTruthy();
          // The real assertion: 5.5 must still satisfy the schema the UI
          // renders, under both thinking settings.
          const parsed = RecommendationSchema.parse(rec);

          const u = response.usage;
          const rate = PRICING[arm.model];
          const cost =
            (u.input_tokens / 1e6) * rate.in +
            (u.output_tokens / 1e6) * rate.out;
          cheapest = Math.min(cheapest, cost);
          dearest = Math.max(dearest, cost);

          lines.push(
            `\n-- ${arm.label}  [${u.input_tokens} in / ${u.output_tokens} out, ` +
              `${ms}ms, $${cost.toFixed(6)}]`
          );
          lines.push(`   headline:   ${parsed.headline}`);
          lines.push(`   summary:    ${parsed.summary}`);
          lines.push(`   bestWindow: ${parsed.bestWindow ?? "(null)"}`);
          for (const a of parsed.activities) {
            lines.push(`   - ${a.verdict.padEnd(5)} ${a.name}: ${a.reason}`);
          }
        }
      }

      lines.push(
        `\n${RULE}\nper-call cost range: $${cheapest.toFixed(6)} .. ` +
          `$${dearest.toFixed(6)}  (${(dearest / cheapest).toFixed(1)}x)`
      );
      console.log(lines.join("\n"));
    }, 180_000);
  }
);
