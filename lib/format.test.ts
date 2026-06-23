import { describe, expect, it } from "vitest";
import { percentInRange, round, upcomingHours } from "./format";

describe("round", () => {
  it("rounds to the nearest integer", () => {
    expect(round(78.3)).toBe(78);
    expect(round(78.6)).toBe(79);
  });
});

describe("percentInRange", () => {
  it("maps a value to its position within the range", () => {
    expect(percentInRange(50, 0, 100)).toBe(50);
    expect(percentInRange(64, 64, 85)).toBe(0);
    expect(percentInRange(85, 64, 85)).toBe(100);
  });

  it("clamps out-of-range values and guards a zero-width range", () => {
    expect(percentInRange(-10, 0, 100)).toBe(0);
    expect(percentInRange(150, 0, 100)).toBe(100);
    expect(percentInRange(70, 70, 70)).toBe(0);
  });
});

describe("upcomingHours", () => {
  const hours = [
    { time: "2026-06-22T12:00" },
    { time: "2026-06-22T13:00" },
    { time: "2026-06-22T14:00" },
    { time: "2026-06-22T15:00" },
  ];

  it("returns entries at or after now, limited to count", () => {
    const now = new Date("2026-06-22T13:00");
    expect(upcomingHours(hours, 2, now)).toEqual([
      { time: "2026-06-22T13:00" },
      { time: "2026-06-22T14:00" },
    ]);
  });

  it("falls back to the start of the list when all hours are in the past", () => {
    const now = new Date("2026-06-23T00:00");
    expect(upcomingHours(hours, 2, now)).toEqual([
      { time: "2026-06-22T12:00" },
      { time: "2026-06-22T13:00" },
    ]);
  });
});
