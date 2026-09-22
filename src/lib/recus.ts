import {
  RECUS_API_BASE,
  RECUS_HEADERS,
  CITIES,
  DEFAULT_CITY,
} from "./constants";
import type {
  RecUsLocationDetailResponse,
  CourtLocation,
  Court,
} from "@/types";

/**
 * Fetch court LOCATION METADATA for a city (no live availability).
 *
 * rec.us edge-filtering 403s every availability endpoint
 * (`/v1/locations/availability`, `/v1/sites/{id}/availability`,
 * `/v1/locations/{id}/schedule`) for server runtimes such as Cloudflare
 * Workers, while the metadata endpoints keep working. So the server provides
 * metadata (locations, courts, pricing, booking links) and browsers fetch
 * per-court availability directly (see `@/lib/availability-client`), which
 * rec.us serves to real browsers (CORS `*`; same calls as rec.us's own
 * frontend).
 *
 * Strategy: per-location `/v1/locations/{id}?publishedSites=true` for the
 * city's configured location IDs, transformed to CourtLocation with EMPTY
 * `availableSlots`. The client fills slots in and recomputes the totals and
 * `availabilityStatus`.
 */
export async function fetchAllCourts(orgSlug?: string): Promise<CourtLocation[]> {
  const city =
    Object.values(CITIES).find((c) => c.slug === (orgSlug || CITIES[DEFAULT_CITY].slug)) ??
    CITIES[DEFAULT_CITY];

  // Fetch location details in parallel (batched to avoid hammering).
  // A single failing location must not take down the whole city: skip it.
  const BATCH_SIZE = 10;
  const details: RecUsLocationDetailResponse[] = [];

  for (let i = 0; i < city.locationIds.length; i += BATCH_SIZE) {
    const batch = city.locationIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (locationId) => {
        try {
          const url = `${RECUS_API_BASE}/v1/locations/${locationId}?publishedSites=true`;
          const res = await fetch(url, { headers: RECUS_HEADERS });
          if (!res.ok) {
            console.warn(
              `rec.us location detail failed for ${locationId}: ${res.status} ${res.statusText}`
            );
            return null;
          }
          return (await res.json()) as RecUsLocationDetailResponse;
        } catch (error) {
          console.warn(`rec.us location detail threw for ${locationId}:`, error);
          return null;
        }
      })
    );

    for (const detail of results) {
      if (detail) details.push(detail);
    }
  }

  if (details.length === 0) {
    throw new Error("rec.us API error: all location detail requests failed");
  }

  return details
    .map(transformLocation)
    .filter((loc) => loc.courts.length > 0);
}

function transformLocation(raw: RecUsLocationDetailResponse): CourtLocation {
  const loc = raw.location;

  const courts: Court[] = (loc.courts ?? [])
    .filter((c) => !c.archivedAt)
    .map((c) => ({
      id: c.id,
      courtNumber: c.courtNumber,
      sportId: c.sports?.[0]?.sportId ?? "",
      priceCentsPerHour: c.config?.pricing?.default?.cents ?? 0,
      allowedDurations: c.allowedReservationDurations?.minutes ?? [90],
      reservationWindowDays: c.defaultReservationWindowDays ?? 7,
      releaseTime: c.reservationReleaseTimeLocal ?? "",
      // Live slots are fetched in the browser (see availability-client).
      availableSlots: [],
      bookingUrl: `https://www.rec.us/locations/${loc.id}?courtId=${c.id}&tab=calendar`,
    }));

  return {
    id: loc.id,
    name: loc.name,
    lat: parseFloat(loc.lat),
    lng: parseFloat(loc.lng),
    address: loc.formattedAddress ?? "",
    hoursOfOperation: typeof loc.hoursOfOperation === "string" ? loc.hoursOfOperation : "",
    accessInfo: loc.accessInfo ?? "",
    gettingThereInfo: loc.gettingThereInfo ?? "",
    imageUrl: loc.images?.detail?.url ?? loc.images?.thumbnail?.url ?? null,
    courts,
    // Recomputed client-side once live slots arrive.
    availabilityStatus: "full",
    totalSlotsToday: 0,
    totalSlotsWeek: 0,
  };
}
