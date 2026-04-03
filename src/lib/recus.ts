import {
  RECUS_API_BASE,
  RECUS_HEADERS,
} from "./constants";
import type {
  RecUsLocationResponse,
  CourtLocation,
  Court,
  TimeSlot,
} from "@/types";

/**
 * Fetch all SF tennis court locations with ACCURATE availability.
 *
 * Strategy:
 *  1. Bulk endpoint → location metadata (name, coords, courts, pricing)
 *  2. Per-site endpoint → actual availability (accounts for real bookings)
 *
 * The bulk endpoint's `availableSlots` field is INACCURATE — it returns
 * theoretical schedule slots, not actual availability. We must use the
 * per-site endpoint for each court to get real data.
 */
export async function fetchAllCourts(): Promise<CourtLocation[]> {
  // Step 1: Get all locations + court metadata from bulk endpoint
  const bulkUrl = `${RECUS_API_BASE}/v1/locations/availability?organizationSlug=san-francisco-rec-park&publishedSites=true`;
  const bulkRes = await fetch(bulkUrl, { headers: RECUS_HEADERS });

  if (!bulkRes.ok) {
    throw new Error(`rec.us API error: ${bulkRes.status} ${bulkRes.statusText}`);
  }

  const rawLocations: RecUsLocationResponse[] = await bulkRes.json();

  // Step 2: Fetch per-site availability for ALL courts in parallel
  const now = new Date();
  const startDate = toSFDate(now);
  const endDate = toSFDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

  // Collect all court IDs
  const allCourts: { courtId: string; locationIndex: number; courtIndex: number }[] = [];
  for (let li = 0; li < rawLocations.length; li++) {
    const courts = rawLocations[li].location.courts;
    for (let ci = 0; ci < courts.length; ci++) {
      allCourts.push({ courtId: courts[ci].id, locationIndex: li, courtIndex: ci });
    }
  }

  // Fetch all per-site availability in parallel (batched to avoid hammering)
  const BATCH_SIZE = 15;
  const siteAvailability = new Map<string, string[]>();

  for (let i = 0; i < allCourts.length; i += BATCH_SIZE) {
    const batch = allCourts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ({ courtId }) => {
        try {
          const url = `${RECUS_API_BASE}/v1/sites/${courtId}/availability?startDate=${startDate}&endDate=${endDate}`;
          const res = await fetch(url, { headers: RECUS_HEADERS });
          if (!res.ok) return { courtId, slots: [] as string[] };

          const data = await res.json();
          const slots: string[] = [];

          // data.data is { "2026-03-30": { "13:30:00": { availableDurationsMinutes: [...] } } }
          for (const [date, times] of Object.entries(data.data || {})) {
            for (const time of Object.keys(times as Record<string, unknown>)) {
              slots.push(`${date} ${time.slice(0, 5)}`);
            }
          }
          return { courtId, slots: slots.sort() };
        } catch {
          return { courtId, slots: [] as string[] };
        }
      })
    );

    for (const { courtId, slots } of results) {
      siteAvailability.set(courtId, slots);
    }
  }

  // Step 3: Transform with REAL availability data
  const todayStr = toSFDate(now);

  return rawLocations
    .map((raw) => transformLocation(raw, siteAvailability, todayStr))
    .filter((loc) => loc.courts.length > 0);
}

function transformLocation(
  raw: RecUsLocationResponse,
  siteAvailability: Map<string, string[]>,
  todayStr: string
): CourtLocation {
  const loc = raw.location;

  const courts: Court[] = loc.courts.map((c) => {
    // Use per-site availability (accurate) instead of bulk availableSlots
    const realSlots = siteAvailability.get(c.id) || [];

    const slots: TimeSlot[] = realSlots.map((s) => ({
      datetime: s,
      date: s.split(" ")[0],
      time: s.split(" ")[1],
    }));

    return {
      id: c.id,
      courtNumber: c.courtNumber,
      sportId: c.sports?.[0]?.sportId ?? "",
      priceCentsPerHour: c.config?.pricing?.default?.cents ?? 0,
      allowedDurations: c.allowedReservationDurations?.minutes ?? [90],
      reservationWindowDays: c.defaultReservationWindowDays,
      releaseTime: c.reservationReleaseTimeLocal,
      availableSlots: slots,
      bookingUrl: `https://www.rec.us/locations/${loc.id}?courtId=${c.id}`,
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

/** Get date string in SF timezone: "2026-03-30" */
function toSFDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}
