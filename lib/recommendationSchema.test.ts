import { describe, expect, it } from "vitest";
import { RecommendationSchema } from "./recommendationSchema";

const valid = {
  headline: "Light jacket — dry until 9pm",
  summary: "A calm, mild evening. Good window for a run before the wind picks up.",
  activities: [
    { name: "Run", verdict: "great", reason: "Cool and dry 6-8pm." },
    { name: "Bike", verdict: "skip", reason: "Gusts after lunch." },
  ],
  bestWindow: "6-8pm",
};

describe("RecommendationSchema", () => {
  it("parses a well-formed recommendation", () => {
    const parsed = RecommendationSchema.parse(valid);
    expect(parsed.activities[0].verdict).toBe("great");
    expect(parsed.bestWindow).toBe("6-8pm");
  });

  it("allows a null bestWindow", () => {
    const parsed = RecommendationSchema.parse({ ...valid, bestWindow: null });
    expect(parsed.bestWindow).toBeNull();
  });

  it("rejects an unknown verdict value", () => {
    const bad = {
      ...valid,
      activities: [{ name: "Run", verdict: "maybe", reason: "..." }],
    };
    expect(() => RecommendationSchema.parse(bad)).toThrow();
  });

  it("rejects a missing headline", () => {
    const { headline, ...rest } = valid;
    void headline;
    expect(() => RecommendationSchema.parse(rest)).toThrow();
  });
});
