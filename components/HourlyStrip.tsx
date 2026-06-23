import type { Forecast } from "../types/weather";
import { unitLabels } from "../types/weather";
import { getWeatherInfo } from "../lib/weatherCodes";
import { formatHour, round, upcomingHours } from "../lib/format";

interface HourlyStripProps {
  forecast: Forecast;
}

const HourlyStrip = ({ forecast }: HourlyStripProps) => {
  const labels = unitLabels(forecast.units);
  // Start from the top of the current hour so the first card is "now".
  const startOfHour = new Date();
  startOfHour.setMinutes(0, 0, 0);
  const hours = upcomingHours(forecast.hourly, 12, startOfHour);

  return (
    <section className="text-white" aria-label="Hourly forecast">
      <h3 className="text-sm uppercase tracking-wide text-white/60 mb-2">
        Next 12 hours
      </h3>
      <ul className="flex gap-3 overflow-x-auto scrollbar-sky snap-x snap-mandatory -mx-1 px-1 pt-1 pb-3">
        {hours.map((h, i) => {
          const { icon: Icon, label } = getWeatherInfo(h.weatherCode);
          const isNow = i === 0;
          return (
            <li
              key={h.time}
              className={`snap-start flex-shrink-0 w-20 rounded-xl border backdrop-blur-sm px-2 py-3 text-center ${
                isNow
                  ? "bg-white/20 border-white/40 ring-1 ring-white/50"
                  : "bg-white/10 border-white/10"
              }`}
            >
              <p
                className={`text-xs ${
                  isNow ? "text-white font-semibold" : "text-white/70"
                }`}
              >
                {isNow ? "Now" : formatHour(h.time)}
              </p>
              <Icon size={34} aria-label={label} className="mx-auto my-1" />
              <p className="font-semibold">
                {round(h.temperature)}
                {labels.temperature}
              </p>
              <p className="text-xs text-sky-300">
                {round(h.precipitationProbability)}%
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default HourlyStrip;
