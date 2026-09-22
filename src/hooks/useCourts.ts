"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CourtLocation } from "@/types";
import type { Sport, CityId } from "@/lib/constants";
import {
  fetchCourtsAvailability,
  availabilityWindow,
  toZoneDate,
} from "@/lib/availability-client";
import { enrichCourtsWithWeatherClient } from "@/lib/weather-client";

interface CourtsData {
  courts: CourtLocation[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCourts(sport: Sport = "tennis", city: CityId = "sf"): CourtsData {
  const [courts, setCourts] = useState<CourtLocation[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const fetchCourts = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    const isLatest = () => requestId === latestRequestId.current;
    setLoading(true);
    setError(null);
    try {
      // 1. Location/court metadata from our server (edge-cached).
      const res = await fetch(`/api/courts?sport=${sport}&city=${city}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!isLatest()) return;
      const metadata: CourtLocation[] = data.courts;
      setFetchedAt(data.fetchedAt);

      // 2. Live availability straight from rec.us in the browser.
      // rec.us blocks server runtimes but serves browsers; a single court
      // failing just yields no slots for that court.
      const courtIds = metadata.flatMap((loc) => loc.courts.map((c) => c.id));
      const { startDate, endDate } = availabilityWindow();
      const slotsByCourt = await fetchCourtsAvailability(courtIds, startDate, endDate);
      if (!isLatest()) return;

      const todayStr = toZoneDate(new Date());
      const withSlots: CourtLocation[] = metadata.map((loc) => {
        const courts = loc.courts.map((court) => ({
          ...court,
          availableSlots: slotsByCourt.get(court.id) ?? [],
        }));
        const totalSlotsToday = courts.reduce(
          (sum, c) => sum + c.availableSlots.filter((s) => s.date === todayStr).length,
          0
        );
        const totalSlotsWeek = courts.reduce((sum, c) => sum + c.availableSlots.length, 0);
        return {
          ...loc,
          courts,
          totalSlotsToday,
          totalSlotsWeek,
          availabilityStatus:
            totalSlotsToday > 0 ? ("available" as const) : totalSlotsWeek > 0 ? ("later" as const) : ("full" as const),
        };
      });

      // 3. Hourly weather per location (best-effort; slots stay without it).
      const withWeather = await enrichCourtsWithWeatherClient(withSlots);
      if (!isLatest()) return;

      setCourts(withWeather);
    } catch (err) {
      if (!isLatest()) return;
      setError(err instanceof Error ? err.message : "Failed to load courts");
    } finally {
      if (!isLatest()) return;
      setLoading(false);
    }
  }, [sport, city]);

  useEffect(() => {
    fetchCourts();
    return () => {
      latestRequestId.current += 1;
    };
  }, [fetchCourts]);

  return { courts, fetchedAt, loading, error, refresh: fetchCourts };
}
