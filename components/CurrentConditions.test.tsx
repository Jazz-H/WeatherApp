import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CurrentConditions from "./CurrentConditions";
import type { Forecast } from "../types/weather";

const forecast: Forecast = {
  location: {
    name: "Charlotte",
    admin1: "North Carolina",
    country: "US",
    latitude: 35.22,
    longitude: -80.84,
  },
  units: "imperial",
  current: {
    time: "2026-06-22T12:00",
    temperature: 78.6,
    apparentTemperature: 80.1,
    humidity: 50,
    weatherCode: 2,
    windSpeed: 6.4,
    precipitation: 0,
    isDay: true,
  },
  hourly: [],
  daily: [
    {
      date: "2026-06-22",
      weatherCode: 2,
      tempMax: 85,
      tempMin: 64,
      precipitationProbabilityMax: 20,
      sunrise: "2026-06-22T06:12",
      sunset: "2026-06-22T20:35",
    },
  ],
};

describe("CurrentConditions", () => {
  it("renders the place, rounded temperature, and today's high/low", () => {
    render(<CurrentConditions forecast={forecast} />);

    expect(
      screen.getByText("Charlotte, North Carolina, US")
    ).toBeInTheDocument();
    expect(screen.getByText("79°F")).toBeInTheDocument(); // 78.6 rounded
    expect(screen.getByLabelText("High")).toHaveTextContent("85");
    expect(screen.getByText(/64°/)).toBeInTheDocument();
  });
});
