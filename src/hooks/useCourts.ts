"use client";

import { useState, useEffect, useCallback } from "react";
import type { CourtLocation } from "@/types";
import type { Sport, CityId } from "@/lib/constants";

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

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courts?sport=${sport}&city=${city}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCourts(data.courts);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts");
    } finally {
      setLoading(false);
    }
  }, [sport, city]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  return { courts, fetchedAt, loading, error, refresh: fetchCourts };
}
