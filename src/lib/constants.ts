// Default map center: San Francisco (generic, no personal address)
export const DEFAULT_LAT = 37.7749;
export const DEFAULT_LNG = -122.4194;

export const RECUS_API_BASE = "https://api.rec.us";
export const RECUS_ORG_SLUG = "san-francisco-rec-park";

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
