import {
  RECUS_API_BASE,
  RECUS_ORG_SLUG,
  RECUS_HEADERS,
} from "./constants";
import type {
  RecUsLocationResponse,
  CourtLocation,
  Court,
  TimeSlot,
} from "@/types";

/**
 * Fetch all SF tennis court locations with availability from rec.us bulk endpoint.
 * One API call returns everything — no pagination needed.
 */
export async function fetchAllCourts(): Promise<CourtLocation[]> {
  const url = `${RECUS_API_BASE}/v1/locations/availability?organizationSlug=${RECUS_ORG_SLUG}&publishedSites=true`;

  const res = await fetch(url, { headers: RECUS_HEADERS });

  if (!res.ok) {
    throw new Error(`rec.us API error: ${res.status} ${res.statusText}`);
  }

  const data: RecUsLocationResponse[] = await res.json();
  return data.map(transformLocation).filter((loc) => loc.courts.length > 0);
}

function transformLocation(raw: RecUsLocationResponse): CourtLocation {
  const loc = raw.location;
  const now = new Date();
  const todayStr = toSFDate(now);

  const courts: Court[] = loc.courts.map((c) => {
    const slots: TimeSlot[] = c.availableSlots.map((s) => ({
      datetime: s,
      date: s.split(" ")[0],
      time: s.split(" ")[1].slice(0, 5), // "07:30"
    }));

    return {
      id: c.id,
      courtNumber: c.courtNumber,
      priceCentsPerHour: c.config?.pricing?.default?.cents ?? 0,
      allowedDurations: c.allowedReservationDurations?.minutes ?? [90],
      reservationWindowDays: c.defaultReservationWindowDays,
      releaseTime: c.reservationReleaseTimeLocal,
      availableSlots: slots,
      bookingUrl: `https://rec.us/organizations/${RECUS_ORG_SLUG}/locations/${loc.id}/reservations/new?courtId=${c.id}`,
    };
  });

  const totalSlotsToday = courts.reduce(
    (sum, c) => sum + c.availableSlots.filter((s) => s.date === todayStr).length,
    0
  );

  const totalSlotsWeek = courts.reduce(
    (sum, c) => sum + c.availableSlots.length,
    0
  );

  let availabilityStatus: "available" | "later" | "full";
  if (totalSlotsToday > 0) {
    availabilityStatus = "available";
  } else if (totalSlotsWeek > 0) {
    availabilityStatus = "later";
  } else {
    availabilityStatus = "full";
  }

  return {
    id: loc.id,
    name: loc.name,
    lat: parseFloat(loc.lat),
    lng: parseFloat(loc.lng),
    address: raw.formattedAddress,
    hoursOfOperation: raw.hoursOfOperation,
    accessInfo: raw.accessInfo,
    gettingThereInfo: raw.gettingThereInfo,
    imageUrl: raw.images?.thumbnail ?? raw.images?.detail ?? null,
    courts,
    availabilityStatus,
    totalSlotsToday,
    totalSlotsWeek,
  };
}

/** Get today's date string in SF timezone: "2026-03-30" */
function toSFDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}
