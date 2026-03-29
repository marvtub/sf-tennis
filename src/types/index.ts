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
}

export interface TravelTime {
  locationId: string;
  walking: { durationMinutes: number; distanceMeters: number } | null;
  driving: { durationMinutes: number; distanceMeters: number } | null;
  transitUrl: string;
}
