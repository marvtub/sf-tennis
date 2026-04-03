import { NextRequest, NextResponse } from "next/server";
import { fetchAllCourts } from "@/lib/recus";
import {
  AVAILABILITY_CACHE_SECONDS,
  SPORT_ID_TENNIS,
  SPORT_ID_PICKLEBALL,
} from "@/lib/constants";
import type { Sport } from "@/lib/constants";

const SPORT_IDS: Record<Sport, string> = {
  tennis: SPORT_ID_TENNIS,
  pickleball: SPORT_ID_PICKLEBALL,
};

/**
 * GET /api/courts?sport=tennis|pickleball
 * Defaults to tennis if not specified.
 */
export async function GET(request: NextRequest) {
  try {
    const sportParam = request.nextUrl.searchParams.get("sport") as Sport | null;
    const sport: Sport = sportParam === "pickleball" ? "pickleball" : "tennis";
    const sportId = SPORT_IDS[sport];

    const allCourts = await fetchAllCourts();

    // Filter each location's courts by sport, then drop locations with no matching courts
    const courts = allCourts
      .map((loc) => ({
        ...loc,
        courts: loc.courts.filter((c) => c.sportId === sportId),
      }))
      .filter((loc) => loc.courts.length > 0)
      .map((loc) => {
        // Recompute availability stats after filtering
        const todayStr = new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Los_Angeles",
        });
        const totalSlotsToday = loc.courts.reduce(
          (sum, c) =>
            sum + c.availableSlots.filter((s) => s.date === todayStr).length,
          0
        );
        const totalSlotsWeek = loc.courts.reduce(
          (sum, c) => sum + c.availableSlots.length,
          0
        );
        const availabilityStatus =
          totalSlotsToday > 0
            ? "available"
            : totalSlotsWeek > 0
            ? "later"
            : "full";

        return {
          ...loc,
          totalSlotsToday,
          totalSlotsWeek,
          availabilityStatus: availabilityStatus as
            | "available"
            | "later"
            | "full",
        };
      });

    return NextResponse.json(
      { courts, sport, fetchedAt: new Date().toISOString() },
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
