import { NextRequest, NextResponse } from "next/server";
import { fetchAllCourts } from "@/lib/recus";
import {
  METADATA_CACHE_SECONDS,
  SPORT_ID_TENNIS,
  SPORT_ID_PICKLEBALL,
  CITIES,
  DEFAULT_CITY,
} from "@/lib/constants";
import type { Sport, CityId } from "@/lib/constants";

const SPORT_IDS: Record<Sport, string> = {
  tennis: SPORT_ID_TENNIS,
  pickleball: SPORT_ID_PICKLEBALL,
};

/**
 * GET /api/courts?sport=tennis|pickleball&city=sf|mountain-view
 *
 * Returns location/court METADATA only. rec.us edge-filtering blocks its
 * availability endpoints for server runtimes, so live `availableSlots` are
 * always empty here (`slotsPending: true`); browsers fetch them directly
 * from rec.us (see `@/lib/availability-client`) and merge them client-side.
 */
export async function GET(request: NextRequest) {
  try {
    const sportParam = request.nextUrl.searchParams.get("sport");
    if (
      sportParam !== null &&
      sportParam !== "tennis" &&
      sportParam !== "pickleball"
    ) {
      return NextResponse.json(
        { error: "Invalid 'sport' parameter" },
        { status: 400 }
      );
    }
    const sport: Sport = sportParam ?? "tennis";
    const sportId = SPORT_IDS[sport];

    const cityParam = request.nextUrl.searchParams.get("city");
    if (
      cityParam !== null &&
      !Object.prototype.hasOwnProperty.call(CITIES, cityParam)
    ) {
      return NextResponse.json(
        { error: "Invalid 'city' parameter" },
        { status: 400 }
      );
    }
    const cityId: CityId = cityParam ?? DEFAULT_CITY;
    const city = CITIES[cityId];

    const allCourts = await fetchAllCourts(city.slug);

    // Filter each location's courts by sport, then drop locations with no matching courts.
    // Slots/totals stay empty here; the browser fills them in.
    const courts = allCourts
      .map((loc) => ({
        ...loc,
        courts: loc.courts.filter((c) => c.sportId === sportId),
      }))
      .filter((loc) => loc.courts.length > 0);

    return NextResponse.json(
      {
        courts,
        sport,
        city: cityId,
        fetchedAt: new Date().toISOString(),
        slotsPending: true,
      },
      {
        headers: {
          "Cache-Control": `s-maxage=${METADATA_CACHE_SECONDS}, stale-while-revalidate=86400`,
        },
      }
    );
  } catch (error) {
    // Log full error server-side; return a generic message to clients to
    // avoid leaking upstream details (URLs, headers, stack hints).
    // Short shared cache + Retry-After dampens crawler/agent retry storms
    // without hiding the outage for long.
    console.error("Failed to fetch courts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch court availability",
        retryAfterSeconds: 60,
      },
      {
        status: 502,
        headers: {
          "Retry-After": "60",
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      }
    );
  }
}
