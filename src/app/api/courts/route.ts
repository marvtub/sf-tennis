import { NextResponse } from "next/server";
import { fetchAllCourts } from "@/lib/recus";
import { AVAILABILITY_CACHE_SECONDS } from "@/lib/constants";

export async function GET() {
  try {
    const courts = await fetchAllCourts();
    return NextResponse.json(
      { courts, fetchedAt: new Date().toISOString() },
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
