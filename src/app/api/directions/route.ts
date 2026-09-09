import { NextRequest, NextResponse } from "next/server";
import { CITIES, DEFAULT_CITY, DIRECTIONS_CACHE_SECONDS } from "@/lib/constants";
import type { TravelTime } from "@/types";

// Each location makes two parallel calls, keeping the total in flight at six.
const DIRECTIONS_LOCATION_CONCURRENCY = 3;
const DIRECTIONS_REQUEST_TIMEOUT_MS = 5_000;
const DIRECTIONS_BATCH_TIMEOUT_MS = 30_000;

interface MapboxDirectionsResult {
  route: TravelTime["walking"];
  cacheable: boolean;
}

function isValidCoordinatePair(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseCoordinatePair(value: string): { lat: number; lng: number } | null {
  const components = value.split(",");
  if (
    components.length !== 2 ||
    components.some((component) => component.trim() === "")
  ) {
    return null;
  }

  const [lat, lng] = components.map(Number);
  return isValidCoordinatePair(lat, lng) ? { lat, lng } : null;
}

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
  const defaultCity = CITIES[DEFAULT_CITY];
  let originLat = defaultCity.lat;
  let originLng = defaultCity.lng;
  if (originParam !== null) {
    const origin = parseCoordinatePair(originParam);
    if (!origin) {
      return NextResponse.json(
        { error: "Invalid 'origin' parameter" },
        { status: 400 }
      );
    }
    originLat = origin.lat;
    originLng = origin.lng;
  }

  const mapboxToken = process.env.MAPBOX_SECRET_TOKEN;
  if (!mapboxToken) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 500 }
    );
  }

  // Cap fan-out — each location triggers 2 Mapbox calls, so without a cap a
  // single request can amplify into a large outbound burst.
  const MAX_LOCATIONS = 50;
  const rawEntries = locationsParam.split("|").slice(0, MAX_LOCATIONS);
  const locations = rawEntries.map((entry) => {
    const [id, coords] = entry.split(":");
    if (!coords) return null;
    const coordinates = parseCoordinatePair(coords);
    if (!coordinates) return null;
    return { id, ...coordinates };
  }).filter((loc): loc is { id: string; lat: number; lng: number } => loc !== null);

  if (locations.length === 0) {
    return NextResponse.json(
      { error: "No valid locations" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DIRECTIONS_BATCH_TIMEOUT_MS
  );
  let results: Array<{ travelTime: TravelTime; cacheable: boolean }>;
  try {
    results = await mapWithConcurrency(
      locations,
      DIRECTIONS_LOCATION_CONCURRENCY,
      async (loc) => {
        const transitUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${loc.lat},${loc.lng}&travelmode=transit`;

        const [walkingResult, drivingResult] = await Promise.all([
          fetchMapboxDirections(
            mapboxToken,
            originLat,
            originLng,
            loc.lat,
            loc.lng,
            "walking",
            controller.signal
          ),
          fetchMapboxDirections(
            mapboxToken,
            originLat,
            originLng,
            loc.lat,
            loc.lng,
            "driving",
            controller.signal
          ),
        ]);

        return {
          travelTime: {
            locationId: loc.id,
            walking: walkingResult.route,
            driving: drivingResult.route,
            transitUrl,
          } satisfies TravelTime,
          cacheable: walkingResult.cacheable && drivingResult.cacheable,
        };
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  const cacheable = results.every((result) => result.cacheable);

  return NextResponse.json(
    { travelTimes: results.map((result) => result.travelTime) },
    {
      headers: {
        "Cache-Control": cacheable
          ? `s-maxage=${DIRECTIONS_CACHE_SECONDS}, stale-while-revalidate=86400`
          : "no-store",
      },
    }
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

async function fetchMapboxDirections(
  token: string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: "walking" | "driving",
  batchSignal: AbortSignal
): Promise<MapboxDirectionsResult> {
  const controller = new AbortController();
  const abortForBatch = () => controller.abort();
  if (batchSignal.aborted) {
    abortForBatch();
  } else {
    batchSignal.addEventListener("abort", abortForBatch, { once: true });
  }
  const timeout = setTimeout(
    () => controller.abort(),
    DIRECTIONS_REQUEST_TIMEOUT_MS
  );

  try {
    // Mapbox uses lng,lat order
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originLng},${originLat};${destLng},${destLat}?access_token=${token}&overview=false`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) return { route: null, cacheable: false };

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      const definitiveNoRoute =
        data.code === "NoRoute" || data.code === "NoSegment";
      return { route: null, cacheable: definitiveNoRoute };
    }
    if (
      !Number.isFinite(route.duration) ||
      route.duration < 0 ||
      !Number.isFinite(route.distance) ||
      route.distance < 0
    ) {
      return { route: null, cacheable: false };
    }

    return {
      route: {
        durationMinutes: Math.round(route.duration / 60),
        distanceMeters: Math.round(route.distance),
      },
      cacheable: true,
    };
  } catch {
    return { route: null, cacheable: false };
  } finally {
    clearTimeout(timeout);
    batchSignal.removeEventListener("abort", abortForBatch);
  }
}
