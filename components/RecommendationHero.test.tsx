import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RecommendationHero from "./RecommendationHero";
import type { Recommendation } from "../lib/recommendationSchema";

const rec: Recommendation = {
  headline: "Light jacket — dry until 9pm",
  summary: "Calm, mild evening. Good window for a run before the wind picks up.",
  activities: [
    { name: "Run", verdict: "great", reason: "Cool and dry this evening." },
    { name: "Wash the car", verdict: "skip", reason: "Rain risk after lunch." },
  ],
  bestWindow: "6-8pm",
};

describe("RecommendationHero", () => {
  it("shows the headline collapsed and hides the detail", () => {
    render(<RecommendationHero recommendation={rec} />);

    expect(screen.getByText(rec.headline)).toBeInTheDocument();
    // Detail (summary + verdicts) is not rendered until expanded.
    expect(screen.queryByText(rec.summary)).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("expands to reveal the summary, best window, and activity verdicts", async () => {
    const user = userEvent.setup();
    render(<RecommendationHero recommendation={rec} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(rec.summary)).toBeInTheDocument();
    expect(screen.getByText(/6-8pm/)).toBeInTheDocument();
    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });
});
