// Default map center: San Francisco
export const DEFAULT_LAT = 37.7603;
export const DEFAULT_LNG = -122.4346;

export const RECUS_API_BASE = "https://api.rec.us";
export const RECUS_ORG_SLUG = "san-francisco-rec-park";

// Required headers to avoid CORS issues when proxying rec.us
export const RECUS_HEADERS = {
  Origin: "https://rec.us",
  Referer: "https://rec.us/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

// Cache durations
export const AVAILABILITY_CACHE_SECONDS = 120; // 2 min — we now make ~100 per-site API calls per refresh
export const DIRECTIONS_CACHE_SECONDS = 86400; // 24 hours
