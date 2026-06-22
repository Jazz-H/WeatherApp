import type { Forecast } from "../types/weather";
import { unitLabels } from "../types/weather";
import { getWeatherInfo } from "../lib/weatherCodes";
import { formatHour, round, upcomingHours } from "../lib/format";

interface HourlyStripProps {
  forecast: Forecast;
}

const HourlyStrip = ({ forecast }: HourlyStripProps) => {
  const labels = unitLabels(forecast.units);
  const hours = upcomingHours(forecast.hourly, 12);

  return (
    <section className="text-white" aria-label="Hourly forecast">
      <h3 className="text-sm uppercase tracking-wide text-white/60 mb-2">
        Next 12 hours
      </h3>
      <ul className="flex gap-3 overflow-x-auto scrollbar-sky snap-x snap-mandatory -mx-1 px-1 pt-1 pb-3">
        {hours.map((h) => {
          const { icon: Icon, label } = getWeatherInfo(h.weatherCode);
          return (
            <li
              key={h.time}
              className="snap-start flex-shrink-0 w-20 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm px-2 py-3 text-center"
            >
              <p className="text-xs text-white/70">{formatHour(h.time)}</p>
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
