import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LAT, DEFAULT_LNG, DIRECTIONS_CACHE_SECONDS } from "@/lib/constants";
import type { TravelTime } from "@/types";

/**
 * GET /api/directions?locations=id1:lat1,lng1|id2:lat2,lng2&origin=lat,lng
 *
 * Returns travel times from origin (or home fallback) to each location.
 * Uses Mapbox Directions API for walking + driving.
 * Generates Google Maps transit link (no API cost).
 */
export async function GET(request: NextRequest) {
  const locationsParam = request.nextUrl.searchParams.get("locations");
  if (!locationsParam) {
    return NextResponse.json(
      { error: "Missing 'locations' parameter" },
      { status: 400 }
    );
  }

  // Parse optional origin; fall back to hardcoded home
  const originParam = request.nextUrl.searchParams.get("origin");
  let originLat = DEFAULT_LAT;
  let originLng = DEFAULT_LNG;
  if (originParam) {
    const [lat, lng] = originParam.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      originLat = lat;
      originLng = lng;
    }
  }

  const mapboxToken = process.env.MAPBOX_SECRET_TOKEN;
  if (!mapboxToken) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 500 }
    );
  }

  const locations = locationsParam.split("|").map((entry) => {
    const [id, coords] = entry.split(":");
    const [lat, lng] = coords.split(",").map(Number);
    return { id, lat, lng };
  });

  const results: TravelTime[] = await Promise.all(
    locations.map(async (loc) => {
      const transitUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${loc.lat},${loc.lng}&travelmode=transit`;

      const [walking, driving] = await Promise.all([
        fetchMapboxDirections(mapboxToken, originLat, originLng, loc.lat, loc.lng, "walking"),
        fetchMapboxDirections(mapboxToken, originLat, originLng, loc.lat, loc.lng, "driving"),
      ]);

      return {
        locationId: loc.id,
        walking,
        driving,
        transitUrl,
      };
    })
  );

  return NextResponse.json(
    { travelTimes: results },
    {
      headers: {
        "Cache-Control": `s-maxage=${DIRECTIONS_CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    }
  );
}

async function fetchMapboxDirections(
  token: string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: "walking" | "driving"
): Promise<{ durationMinutes: number; distanceMeters: number } | null> {
  try {
    // Mapbox uses lng,lat order
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originLng},${originLat};${destLng},${destLat}?access_token=${token}&overview=false`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      durationMinutes: Math.round(route.duration / 60),
      distanceMeters: Math.round(route.distance),
    };
  } catch {
    return null;
  }
}
