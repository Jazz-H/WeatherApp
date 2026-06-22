import type { Forecast } from "../types/weather";
import { unitLabels } from "../types/weather";
import { getWeatherInfo } from "../lib/weatherCodes";
import { formatWeekday, round } from "../lib/format";

interface DailyOutlookProps {
  forecast: Forecast;
}

const DailyOutlook = ({ forecast }: DailyOutlookProps) => {
  const labels = unitLabels(forecast.units);

  return (
    <section className="text-white" aria-label="7-day outlook">
      <h3 className="text-sm uppercase tracking-wide text-white/60 mb-2">
        7-day outlook
      </h3>
      <ul className="divide-y divide-white/10 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm px-3">
        {forecast.daily.map((d, i) => {
          const { icon: Icon, label } = getWeatherInfo(d.weatherCode);
          return (
            <li key={d.date} className="flex items-center gap-3 py-2">
              <span className="w-12 text-white/80">
                {i === 0 ? "Today" : formatWeekday(d.date)}
              </span>
              <Icon size={28} aria-label={label} />
              <span className="flex-1 text-sky-300 text-sm">
                {round(d.precipitationProbabilityMax)}%
              </span>
              <span className="font-semibold w-12 text-right">
                {round(d.tempMax)}
                {labels.temperature}
              </span>
              <span className="text-white/50 w-12 text-right">
                {round(d.tempMin)}
                {labels.temperature}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default DailyOutlook;
