// Weather conditions the garden can render.
export type Weather = "clear" | "clouds" | "rain" | "snow";

// Map a WMO weather code (from Open-Meteo) to a garden condition.
export function codeToWeather(code: number): Weather {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  )
    return "rain";
  if (code >= 1 && code <= 48) return "clouds"; // partly cloudy, overcast, fog
  return "clear"; // 0
}

// Fetch the current weather for the given coordinates. No API key required.
export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
  const data = await res.json();
  return codeToWeather(data?.current?.weather_code ?? 0);
}
