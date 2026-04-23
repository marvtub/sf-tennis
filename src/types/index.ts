// ── rec.us API response types ──

export interface RecUsLocationResponse {
  location: RecUsLocation;
  formattedAddress: string;
  hoursOfOperation: string;
  images: Record<string, string>;
  accessInfo: string;
  gettingThereInfo: string;
  distance: number | null;
}

export interface RecUsLocation {
  id: string;
  name: string;
  organizationId: string;
  timezone: string;
  lat: string;
  lng: string;
  defaultReservationWindow: number;
  reservationReleaseTimeLocal: string;
  courts: RecUsCourt[];
}

export interface RecUsCourt {
  id: string;
  locationId: string;
  courtNumber: string;
  publishedAt: string;
  maxReservationTime: string; // "01:30:00"
  defaultReservationWindowDays: number;
  reservationReleaseTimeLocal: string;
  config: {
    pricing: {
      default: { type: string; cents: number };
      rules?: Array<unknown>;
    };
    bookingPolicies: Array<{
      type: string;
      slots: Array<{
        dayOfWeek: number;
        startTimeLocal: string;
        endTimeLocal: string;
      }>;
      isActive: boolean;
    }>;
  };
  allowedReservationDurations: { minutes: number[] };
  availableSlots: string[]; // "2026-03-30 07:30:00"
  sports?: Array<{ id: string; sportId: string }>;
  isInstantBookable: boolean;
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

// ── Persisted data types (D1) ──

export interface FavouriteCourt {
  locationId: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  emoji: string; // e.g. "👩" for Gabriella
  createdAt: string;
}

export interface PlayHistory {
  id: string;
  locationId: string;
  locationName: string;
  courtNumber: string | null;
  date: string; // "2026-03-29"
  time: string | null; // "18:00"
  friends: string[]; // friend IDs
  notes: string;
  createdAt: string;
}
