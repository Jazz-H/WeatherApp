import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Weather from "./Weather";
import type { WeatherData } from "../types/weather";

const fixture: WeatherData = {
  name: "Charlotte",
  timezone: -14400,
  sys: { country: "US" },
  weather: [{ icon: "01d", description: "clear sky" }],
  main: {
    temp: 72.4,
    feels_like: 71.1,
    temp_max: 75,
    temp_min: 68,
    humidity: 40,
  },
  wind: { speed: 6.2, gust: 9 },
  clouds: { all: 5 },
};

describe("Weather", () => {
  it("renders the city, country and rounded temperature", () => {
    render(<Weather data={fixture} />);

    expect(
      screen.getByText(/Weather in Charlotte, US/i)
    ).toBeInTheDocument();
    expect(screen.getByText("clear sky")).toBeInTheDocument();
    // 72.4 -> "72" appears for both the hero and the "Current temp" card
    expect(screen.getAllByText(/72°/).length).toBeGreaterThan(0);
  });
});
