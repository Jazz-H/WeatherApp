import type { Forecast } from "../types/weather";
import { getWeatherInfo } from "../lib/weatherCodes";
import { formatWeekday, percentInRange, round } from "../lib/format";

interface DailyOutlookProps {
  forecast: Forecast;
}

const DailyOutlook = ({ forecast }: DailyOutlookProps) => {
  const days = forecast.daily;
  const weekMin = Math.min(...days.map((d) => d.tempMin));
  const weekMax = Math.max(...days.map((d) => d.tempMax));

  return (
    <section className="text-white" aria-label="7-day outlook">
      <h3 className="text-sm uppercase tracking-wide text-white/60 mb-2">
        7-day outlook
      </h3>
      <ul className="divide-y divide-white/10 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm px-3">
        {days.map((d, i) => {
          const { icon: Icon, label } = getWeatherInfo(d.weatherCode);
          const lo = percentInRange(d.tempMin, weekMin, weekMax);
          const hi = percentInRange(d.tempMax, weekMin, weekMax);
          return (
            <li key={d.date} className="flex items-center gap-3 py-2.5">
              <span className="w-10 text-white/80 text-sm">
                {i === 0 ? "Today" : formatWeekday(d.date)}
              </span>
              <Icon size={24} aria-label={label} className="flex-shrink-0" />
              <span className="w-9 text-sky-300 text-xs text-right">
                {round(d.precipitationProbabilityMax)}%
              </span>
              <span className="w-8 text-right text-white/55 text-sm">
                {round(d.tempMin)}°
              </span>
              <div
                className="flex-1 h-1.5 rounded-full bg-white/10 relative"
                aria-hidden
              >
                <div
                  className="absolute inset-y-0 rounded-full bg-white/80"
                  style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 4)}%` }}
                />
              </div>
              <span className="w-8 text-right font-semibold text-sm">
                {round(d.tempMax)}°
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default DailyOutlook;
