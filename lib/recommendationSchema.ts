import { z } from "zod";

// The shape the UI renders. Structured output validates the model response
// against this schema, so the client always gets well-formed data or a clear
// failure (see pages/api/summarize.ts).
export const RecommendationSchema = z.object({
  headline: z.string(), // "Light jacket — dry until 9pm"
  summary: z.string(), // 1-2 friendly sentences, no raw numbers
  activities: z.array(
    z.object({
      name: z.string(), // "Run", "Bike", "Walk the dog"
      verdict: z.enum(["great", "ok", "skip"]),
      reason: z.string(), // short, specific
    })
  ),
  bestWindow: z.string().nullable(), // "6-8pm" or null
});

export type Verdict = "great" | "ok" | "skip";
export type Activity = z.infer<typeof RecommendationSchema>["activities"][number];
export type Recommendation = z.infer<typeof RecommendationSchema>;
