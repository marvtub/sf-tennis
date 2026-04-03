"use client";

import { useState, useEffect } from "react";
import type { CourtLocation, TravelTime } from "@/types";
import type { UserLocation } from "@/hooks/useUserLocation";

const CACHE_PREFIX = "sf-travel-times";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  travelTimes: TravelTime[];
  cachedAt: number;
}

function cacheKey(origin: UserLocation, courtIds: string): string {
  // Round to ~100m precision so tiny GPS jitter doesn't bust the cache
  const lat = origin.lat.toFixed(3);
  const lng = origin.lng.toFixed(3);
  // Include hash of court IDs so sport toggle busts cache correctly
  let hash = 0;
  for (let i = 0; i < courtIds.length; i++) {
    hash = ((hash << 5) - hash + courtIds.charCodeAt(i)) | 0;
  }
  return `${CACHE_PREFIX}:${lat},${lng}:${hash}`;
}

export function useTravelTimes(
  courts: CourtLocation[],
  origin: UserLocation
): Map<string, TravelTime> {
  const [travelTimes, setTravelTimes] = useState<Map<string, TravelTime>>(
    new Map()
  );

  useEffect(() => {
    if (courts.length === 0) return;

    const courtIdStr = courts.map((c) => c.id).join(",");
    const key = cacheKey(origin, courtIdStr);

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_DURATION_MS) {
          const map = new Map(parsed.travelTimes.map((t) => [t.locationId, t]));
          setTravelTimes(map);
          return;
        }
      }
    } catch {
      // Cache miss, continue to fetch
    }

    // Build locations param: id1:lat1,lng1|id2:lat2,lng2
    const locationsParam = courts
      .map((c) => `${c.id}:${c.lat},${c.lng}`)
      .join("|");

    const originParam = `${origin.lat},${origin.lng}`;

    fetch(`/api/directions?locations=${encodeURIComponent(locationsParam)}&origin=${encodeURIComponent(originParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { travelTimes: TravelTime[] }) => {
        const map = new Map(data.travelTimes.map((t) => [t.locationId, t]));
        setTravelTimes(map);

        // Cache in localStorage
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              travelTimes: data.travelTimes,
              cachedAt: Date.now(),
            })
          );
        } catch {
          // localStorage full, ignore
        }
      })
      .catch((err) => {
        console.error("Failed to fetch travel times:", err);
      });
  }, [courts, origin.lat, origin.lng]);

  return travelTimes;
}
