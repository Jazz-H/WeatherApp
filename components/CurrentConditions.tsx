import type { Forecast } from "../types/weather";
import { unitLabels } from "../types/weather";
import { getWeatherInfo } from "../lib/weatherCodes";
import { round } from "../lib/format";

interface CurrentConditionsProps {
  forecast: Forecast;
}

const CurrentConditions = ({ forecast }: CurrentConditionsProps) => {
  const { current, location, units } = forecast;
  const labels = unitLabels(units);
  const { label, icon: Icon } = getWeatherInfo(
    current.weatherCode,
    current.isDay
  );

  const place = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");

  const stats = [
    { label: "Feels like", value: `${round(current.apparentTemperature)}${labels.temperature}` },
    { label: "Humidity", value: `${round(current.humidity)}%` },
    { label: "Wind", value: `${round(current.windSpeed)} ${labels.windSpeed}` },
    { label: "Precip", value: `${current.precipitation} mm` },
  ];

  return (
    <section className="text-white" aria-label="Current conditions">
      <h2 className="text-2xl font-semibold">{place}</h2>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <Icon size={88} aria-hidden className="text-white" />
          <div>
            <p className="text-7xl font-bold leading-none">
              {round(current.temperature)}
              {labels.temperature}
            </p>
            <p className="text-white/80 mt-1">{label}</p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white/10 border border-white/10 px-3 py-2"
          >
            <dt className="text-xs uppercase tracking-wide text-white/60">
              {s.label}
            </dt>
            <dd className="text-lg font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default CurrentConditions;
