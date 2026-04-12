import { NextRequest, NextResponse } from "next/server";
import { fetchAllCourts } from "@/lib/recus";
import { enrichCourtsWithWeather } from "@/lib/weather";
import {
  AVAILABILITY_CACHE_SECONDS,
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
 */
export async function GET(request: NextRequest) {
  try {
    const sportParam = request.nextUrl.searchParams.get("sport") as Sport | null;
    const sport: Sport = sportParam === "pickleball" ? "pickleball" : "tennis";
    const sportId = SPORT_IDS[sport];

    const cityParam = request.nextUrl.searchParams.get("city") as CityId | null;
    const cityId: CityId = cityParam && cityParam in CITIES ? cityParam : DEFAULT_CITY;
    const city = CITIES[cityId];

    const allCourts = await fetchAllCourts(city.slug);

    // Filter each location's courts by sport, then drop locations with no matching courts
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });

    const courts = allCourts
      .map((loc) => {
        const filtered = loc.courts.filter((c) => c.sportId === sportId);
        const totalSlotsToday = filtered.reduce(
          (sum, c) =>
            sum + c.availableSlots.filter((s) => s.date === todayStr).length,
          0
        );
        const totalSlotsWeek = filtered.reduce(
          (sum, c) => sum + c.availableSlots.length,
          0
        );
        const availabilityStatus: "available" | "later" | "full" =
          totalSlotsToday > 0 ? "available" : totalSlotsWeek > 0 ? "later" : "full";

        return {
          ...loc,
          courts: filtered,
          totalSlotsToday,
          totalSlotsWeek,
          availabilityStatus,
        };
      })
      .filter((loc) => loc.courts.length > 0);

    const courtsWithWeather = await enrichCourtsWithWeather(courts);

    return NextResponse.json(
      { courts: courtsWithWeather, sport, city: cityId, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": `s-maxage=${AVAILABILITY_CACHE_SECONDS}, stale-while-revalidate=300`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch courts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch court availability",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
