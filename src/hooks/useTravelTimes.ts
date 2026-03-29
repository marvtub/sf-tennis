"use client";

import { useState, useEffect } from "react";
import type { CourtLocation, TravelTime } from "@/types";

const CACHE_KEY = "sf-tennis-travel-times";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  travelTimes: TravelTime[];
  cachedAt: number;
}

export function useTravelTimes(courts: CourtLocation[]): Map<string, TravelTime> {
  const [travelTimes, setTravelTimes] = useState<Map<string, TravelTime>>(
    new Map()
  );

  useEffect(() => {
    if (courts.length === 0) return;

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
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

    fetch(`/api/directions?locations=${encodeURIComponent(locationsParam)}`)
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
            CACHE_KEY,
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
  }, [courts]);

  return travelTimes;
}
