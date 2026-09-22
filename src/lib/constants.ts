export const RECUS_API_BASE = "https://api.rec.us";

// City configurations
export interface CityConfig {
  slug: string;
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
  zoom: number;
  /**
   * rec.us location UUIDs for this city. The bulk availability endpoint is
   * edge-blocked for server runtimes, so metadata is fetched per location via
   * `/v1/locations/{id}` (reachable). IDs swept from the public locations
   * index on 2026-09-22; the SF set exactly matches the legacy bulk response.
   */
  locationIds: string[];
}

export const CITIES: Record<string, CityConfig> = {
  sf: {
    slug: "san-francisco-rec-park",
    label: "San Francisco",
    shortLabel: "SF",
    lat: 37.7749,
    lng: -122.4194,
    zoom: 12.5,
    locationIds: [
      "81cd2b08-8ea6-40ee-8c89-aeba92506576", // Alice Marble
      "859002da-e08e-4ae1-8d30-373d6c0a672e", // Alta Plaza
      "c41c7b8f-cb09-415a-b8ea-ad4b82d792b9", // Balboa
      "3f842b1e-13f9-447d-ab12-62b62d954d3e", // Buena Vista
      "779905bd-4c2b-45b3-abd0-48140998bca1", // Crocker Amazon
      "95745483-6b38-4e99-8ba2-a3e23cda8587", // Dolores
      "d3fc78ce-0617-40dc-b7f7-d41ba95f09ef", // DuPont
      "070037ab-f407-486a-9f88-989905be1039", // Fulton
      "16fdf80f-4e50-452a-843f-63d159c798e2", // Glen Canyon
      "8c3b9b04-a149-4080-b648-e3ff8365bbee", // Hamilton
      "3552b6f7-e7bd-4334-9e4a-731b015447e0", // Helen Wills
      "360736ab-a655-478d-aab5-4e54fea0c140", // Jackson
      "8f8e510f-e0d8-4364-8531-a9a0d0d6b2b8", // Joe DiMaggio
      "7a8ef25a-dc20-4046-8aab-7212a9a41d20", // J.P. Murphy
      "c4fc2b3e-d1bc-47d9-b920-76d00d32b20b", // Lafayette
      "9d05fa5b-38fc-49b7-88c5-74825703d936", // McLaren
      "bb6254d3-0ef0-475d-8de9-ac7d6b0323f4", // Minnie & Lovie Ward
      "5a52a5e8-2e9f-4976-8a5c-0bc53d51afe9", // Miraloma
      "fb0d16b1-5f9f-465f-8ebf-fccf5d400c47", // Moscone
      "af2cd971-0c10-479d-a12e-ca63d55f71be", // Mountain Lake
      "5a0b8fa6-11db-433e-9314-bafb956d8622", // Parkside Square
      "032e605f-6065-4794-9675-b1bbebe18159", // Potrero Hill
      "c2f20478-83d8-48c9-af3d-065d7ba22d60", // Presidio Wall
      "95f7e887-5096-463b-834a-09d67889557e", // Richmond
      "ad9e28e1-2d02-4fb5-b31d-b75f63841814", // Rossi
      "1a5a0d4b-ef5d-44ab-a8ab-a13f39dcdc7d", // Stern Grove
      "25eafd72-ca31-4df7-8850-79c05edf3796", // St. Mary's
      "fe61cfdb-abf7-4f52-8ce4-45feb58f10b7", // Sunset
      "2a18ef67-333c-4d9c-a86c-e0709f07f5c3", // Upper Noe
    ],
  },
  "mountain-view": {
    slug: "city-of-mountain-view",
    label: "Mountain View",
    shortLabel: "MV",
    lat: 37.3861,
    lng: -122.0839,
    zoom: 13.5,
    locationIds: [
      "748f4e0b-dda6-4c67-9e4f-776cb298fdfb", // Cooper Park
      "da9a948c-bb55-47ea-94a9-e454a2b7b71b", // Rengstorff Park
      "44b795ad-50e3-4012-acdd-3e10939e812d", // Stevenson Park
      "e68dcacd-9f08-40ac-8a02-63b419610b76", // Sylvan Park
      "c37c5109-4f96-499f-b5d5-28de8adf20de", // Whisman Park
    ],
  },
};

export type CityId = keyof typeof CITIES;
export const DEFAULT_CITY: CityId = "sf";

// Required headers to avoid CORS issues when proxying rec.us.
// rec.us edge-filtering 403s availability requests without
// `Accept: application/json` (fetch's `*/*` default is blocked).
export const RECUS_HEADERS = {
  Origin: "https://rec.us",
  Referer: "https://rec.us/",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

// Sport IDs from rec.us
export const SPORT_ID_TENNIS = "bd745b6e-1dd6-43e2-a69f-06f094808a96";
export const SPORT_ID_PICKLEBALL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export type Sport = "tennis" | "pickleball";

// Cache durations
export const AVAILABILITY_CACHE_SECONDS = 120; // 2 min — browsers refetch per-court availability on each refresh
export const METADATA_CACHE_SECONDS = 3600; // 1 hour — location/court metadata rarely changes
export const DIRECTIONS_CACHE_SECONDS = 86400; // 24 hours
