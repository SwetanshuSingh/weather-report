const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/forecast.json";

const apiKey = process.env.WEATHERAPI_KEY;
if (!apiKey) {
  console.error("Missing WEATHERAPI_KEY (set env var or add it to .env).");
  process.exit(1);
}

const getWeatherForecast = async (city, apiKey) => {
  const url = new URL(WEATHER_API_BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", city);
  url.searchParams.set("days", "1");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`WeatherAPI error: ${response.status}`);

  const data = await response.json();
  const current = data.current ?? {};
  const hours = data.forecast?.forecastday?.[0]?.hour ?? [];

  // Pick the forecast hour that matches the "current" timestamp.
  // WeatherAPI provides `current.last_updated_epoch` (seconds).
  const epoch = current.last_updated_epoch;
  const currentHour =
    (typeof epoch === "number" &&
      hours.find(
        (h) => epoch >= h.time_epoch && epoch < h.time_epoch + 3600,
      )) ||
    (hours.find((h) => typeof epoch === "number" && h.time_epoch >= epoch) ??
      hours[0] ??
      {});

  const report = {
    location: data.location?.name ?? city,
    localTime: data.location?.localtime ?? "",
    willItRain: currentHour.will_it_rain === 1,
    chanceOfRainPercent: currentHour.chance_of_rain ?? 0,
    precipMm: currentHour.precip_mm ?? current.precip_mm ?? 0,
  };

  return report;
};

const getWeatherForecasts = async (cities, apiKey) => {
  const forecasts = await Promise.all(
    cities.map((city) => getWeatherForecast(city, apiKey)),
  );
  return forecasts;
};

const main = async () => {
  const cities = ["Dubai", "Sharjah", "Jebel Ali", "Abu Dhabi"];
  const forecasts = await getWeatherForecasts(cities, apiKey);
  console.log(JSON.stringify(forecasts));
  return forecasts;
};

main();
