// NOTE: This models the current OpenWeatherMap response shape.
// Phase 1 replaces the data layer with Open-Meteo and these types will change.
export interface WeatherData {
  name: string;
  timezone: number;
  sys: { country: string };
  weather: { icon: string; description: string }[];
  main: {
    temp: number;
    feels_like: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
  };
  wind: { speed: number; gust: number };
  clouds: { all: number };
}
