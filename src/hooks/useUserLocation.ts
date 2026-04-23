"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CITIES, DEFAULT_CITY } from "@/lib/constants";
import type { CityId } from "@/lib/constants";

export interface UserLocation {
  lat: number;
  lng: number;
  isDefault: boolean; // true = fallback to city center
}

interface UseUserLocationResult extends UserLocation {
  status: "idle" | "requesting" | "resolved" | "fallback" | "unsupported";
  requestLocation: (options?: { forceFresh?: boolean }) => void;
}

/**
 * Browser geolocation with explicit retry support.
 * Falls back to city center on denial or error.
 */
export function useUserLocation(
  cityId: CityId = DEFAULT_CITY
): UseUserLocationResult {
  const city = CITIES[cityId] ?? CITIES[DEFAULT_CITY];
  const [location, setLocation] = useState<UserLocation>({
    lat: city.lat,
    lng: city.lng,
    isDefault: true,
  });
  const [geoResolved, setGeoResolved] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [forceFresh, setForceFresh] = useState(false);
  const [status, setStatus] = useState<UseUserLocationResult["status"]>("idle");

  // Update fallback when city changes (only if geolocation hasn't resolved)
  useEffect(() => {
    if (!geoResolved) {
      setLocation({ lat: city.lat, lng: city.lng, isDefault: true });
      setStatus((current) =>
        current === "unsupported" ? current : geoResolved ? current : "fallback"
      );
    }
  }, [cityId, city.lat, city.lng, geoResolved]);

  const requestLocation = useCallback((options?: { forceFresh?: boolean }) => {
    setForceFresh(Boolean(options?.forceFresh));
    setRequestVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isDefault: false,
        });
        setGeoResolved(true);
        setStatus("resolved");
      },
      () => {
        setGeoResolved(false);
        setLocation({ lat: city.lat, lng: city.lng, isDefault: true });
        setStatus("fallback");
      },
      {
        enableHighAccuracy: forceFresh,
        timeout: forceFresh ? 15000 : 10000,
        maximumAge: forceFresh ? 0 : 300000,
      }
    );
  }, [city.lat, city.lng, forceFresh, requestVersion]);

  // Memoize so consumers get a stable reference when lat/lng haven't changed
  return useMemo(
    () => ({
      ...location,
      status,
      requestLocation,
    }),
    [location.lat, location.lng, location.isDefault, requestLocation, status]
  );
}
