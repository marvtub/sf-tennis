export const RECUS_API_BASE = "https://api.rec.us";

// City configurations
export interface CityConfig {
  slug: string;
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const CITIES: Record<string, CityConfig> = {
  sf: {
    slug: "san-francisco-rec-park",
    label: "San Francisco",
    shortLabel: "SF",
    lat: 37.7749,
    lng: -122.4194,
    zoom: 12.5,
  },
  "mountain-view": {
    slug: "city-of-mountain-view",
    label: "Mountain View",
    shortLabel: "MV",
    lat: 37.3861,
    lng: -122.0839,
    zoom: 13.5,
  },
};

export type CityId = keyof typeof CITIES;
export const DEFAULT_CITY: CityId = "sf";

// Required headers to avoid CORS issues when proxying rec.us
export const RECUS_HEADERS = {
  Origin: "https://rec.us",
  Referer: "https://rec.us/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

// Sport IDs from rec.us
export const SPORT_ID_TENNIS = "bd745b6e-1dd6-43e2-a69f-06f094808a96";
export const SPORT_ID_PICKLEBALL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export type Sport = "tennis" | "pickleball";

// Cache durations
export const AVAILABILITY_CACHE_SECONDS = 120; // 2 min — we now make ~100 per-site API calls per refresh
export const DIRECTIONS_CACHE_SECONDS = 86400; // 24 hours
