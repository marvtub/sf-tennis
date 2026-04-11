import type { CourtLocation, SlotWeather } from "@/types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const WEATHER_BATCH_SIZE = 8;

interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
  };
}

export async function enrichCourtsWithWeather(
  locations: CourtLocation[]
): Promise<CourtLocation[]> {
  const weatherByLocation = new Map<string, Map<string, SlotWeather>>();

  for (let i = 0; i < locations.length; i += WEATHER_BATCH_SIZE) {
    const batch = locations.slice(i, i + WEATHER_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (location) => {
        const weather = await fetchLocationWeather(location.lat, location.lng);
        return { locationId: location.id, weather };
      })
    );

    for (const result of results) {
      weatherByLocation.set(result.locationId, result.weather);
    }
  }

  return locations.map((location) => {
    const weather = weatherByLocation.get(location.id) ?? new Map<string, SlotWeather>();

    return {
      ...location,
      courts: location.courts.map((court) => ({
        ...court,
        availableSlots: court.availableSlots.map((slot) => ({
          ...slot,
          weather: weather.get(normalizeSlotKey(slot.date, slot.time)) ?? null,
        })),
      })),
    };
  });
}

async function fetchLocationWeather(
  lat: number,
  lng: number
): Promise<Map<string, SlotWeather>> {
  try {
    const url = new URL(OPEN_METEO_BASE);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set(
      "hourly",
      "temperature_2m,precipitation_probability,weather_code,wind_speed_10m"
    );
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("timezone", "America/Los_Angeles");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Map();

    const data: OpenMeteoResponse = await res.json();
    const times = data.hourly?.time ?? [];
    const temps = data.hourly?.temperature_2m ?? [];
    const precip = data.hourly?.precipitation_probability ?? [];
    const codes = data.hourly?.weather_code ?? [];
    const wind = data.hourly?.wind_speed_10m ?? [];

    const out = new Map<string, SlotWeather>();
    for (let i = 0; i < times.length; i++) {
      const time = times[i]; // 2026-04-11T08:00
      const [date, hhmm] = time.split("T");
      const key = normalizeSlotKey(date, hhmm.slice(0, 5));
      out.set(key, formatWeather(temps[i], precip[i], codes[i], wind[i]));
    }

    return out;
  } catch {
    return new Map();
  }
}

function normalizeSlotKey(date: string, time: string): string {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  const roundedHour = minute >= 30 ? hour + 1 : hour;

  const normalizedDate = new Date(`${date}T12:00:00-07:00`);
  if (roundedHour >= 24) {
    normalizedDate.setDate(normalizedDate.getDate() + 1);
  }

  const nextDate = normalizedDate.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  const nextHour = roundedHour % 24;
  return `${nextDate} ${String(nextHour).padStart(2, "0")}:00`;
}

function formatWeather(
  temperatureC?: number,
  precipitationProbability?: number,
  weatherCode?: number,
  windSpeedKph?: number
): SlotWeather {
  const { label, emoji } = describeWeatherCode(weatherCode ?? null);
  return {
    temperatureC: Number.isFinite(temperatureC) ? Math.round(temperatureC as number) : null,
    precipitationProbability: Number.isFinite(precipitationProbability)
      ? Math.round(precipitationProbability as number)
      : null,
    windSpeedKph: Number.isFinite(windSpeedKph) ? Math.round(windSpeedKph as number) : null,
    weatherCode: Number.isFinite(weatherCode) ? Math.round(weatherCode as number) : null,
    label,
    emoji,
  };
}

function describeWeatherCode(code: number | null): { label: string; emoji: string } {
  switch (code) {
    case 0:
      return { label: "Clear", emoji: "☀️" };
    case 1:
    case 2:
      return { label: "Partly cloudy", emoji: "⛅" };
    case 3:
      return { label: "Cloudy", emoji: "☁️" };
    case 45:
    case 48:
      return { label: "Fog", emoji: "🌫️" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: "Drizzle", emoji: "🌦️" };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: "Rain", emoji: "🌧️" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: "Snow", emoji: "🌨️" };
    case 95:
    case 96:
    case 99:
      return { label: "Storm", emoji: "⛈️" };
    default:
      return { label: "Forecast", emoji: "🌤️" };
  }
}
