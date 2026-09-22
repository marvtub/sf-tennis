// ── rec.us API response types ──
//
// Only the metadata endpoints are reachable from server runtimes; the
// availability endpoints are edge-blocked (see lib/recus.ts). These types
// describe `GET /v1/locations/{id}?publishedSites=true`.

export interface RecUsLocationDetailResponse {
  location: RecUsLocationDetail;
  distance: number | null;
}

export interface RecUsLocationDetail {
  id: string;
  name: string;
  lat: string;
  lng: string;
  formattedAddress?: string;
  hoursOfOperation?: string | null;
  accessInfo?: string | null;
  gettingThereInfo?: string | null;
  images?: {
    detail?: { url?: string };
    thumbnail?: { url?: string };
  };
  courts?: RecUsDetailCourt[];
}

export interface RecUsDetailCourt {
  id: string;
  courtNumber: string;
  sports?: Array<{ sportId: string }>;
  config?: {
    pricing?: {
      default?: { type: string; cents: number };
    };
  };
  allowedReservationDurations?: { minutes: number[] };
  defaultReservationWindowDays?: number | null;
  reservationReleaseTimeLocal?: string | null;
  archivedAt?: string | null;
}

// ── App types (transformed for frontend) ──

export interface CourtLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  hoursOfOperation: string;
  accessInfo: string;
  gettingThereInfo: string;
  imageUrl: string | null;
  courts: Court[];
  // Computed
  availabilityStatus: "available" | "later" | "full";
  totalSlotsToday: number;
  totalSlotsWeek: number;
}

export interface Court {
  id: string;
  courtNumber: string;
  sportId: string; // rec.us sport UUID
  priceCentsPerHour: number;
  allowedDurations: number[]; // in minutes
  reservationWindowDays: number;
  releaseTime: string;
  availableSlots: TimeSlot[];
  bookingUrl: string;
}

export interface TimeSlot {
  datetime: string; // ISO-ish: "2026-03-30 07:30:00"
  date: string; // "2026-03-30"
  time: string; // "07:30"
  weather?: SlotWeather | null;
}

export interface SlotWeather {
  temperatureC: number | null;
  precipitationProbability: number | null;
  windSpeedKph: number | null;
  weatherCode: number | null;
  label: string;
  emoji: string;
}

export interface TravelTime {
  locationId: string;
  walking: { durationMinutes: number; distanceMeters: number } | null;
  driving: { durationMinutes: number; distanceMeters: number } | null;
  transitUrl: string;
}

// ── Filter types ──

export interface AvailabilityFilter {
  date: string | null; // "2026-03-30" or null for any day
  weekendOnly?: boolean;
  timeFrom: string | null; // "09:00" or null
  timeTo: string | null; // "17:00" or null
}
