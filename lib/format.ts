// Small, pure formatting helpers shared across the weather UI.

export function round(n: number): number {
  return Math.round(n);
}

// Position of `value` within [min, max] as a 0–100 percent (clamped).
// Used to draw the daily temperature-range bars.
export function percentInRange(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, pct));
}

// Open-Meteo returns local ISO timestamps like "2026-06-22T14:00".
export function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric" });
}

export function formatWeekday(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short" });
}

export function formatClockTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// The next `count` hourly entries at or after `now`.
export function upcomingHours<T extends { time: string }>(
  hours: T[],
  count: number,
  now: Date = new Date()
): T[] {
  const nowMs = now.getTime();
  const future = hours.filter((h) => new Date(h.time).getTime() >= nowMs);
  return (future.length > 0 ? future : hours).slice(0, count);
}
