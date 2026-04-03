"use client";

import { useState, useEffect, useMemo } from "react";
import { CITIES, DEFAULT_CITY } from "@/lib/constants";
import type { CityId } from "@/lib/constants";

export interface UserLocation {
  lat: number;
  lng: number;
  isDefault: boolean; // true = fallback to city center
}

/**
 * One-shot browser geolocation.
 * Falls back silently to city center on denial or error.
 */
export function useUserLocation(cityId: CityId = DEFAULT_CITY): UserLocation {
  const city = CITIES[cityId] ?? CITIES[DEFAULT_CITY];
  const [location, setLocation] = useState<UserLocation>({
    lat: city.lat,
    lng: city.lng,
    isDefault: true,
  });
  const [geoResolved, setGeoResolved] = useState(false);

  // Update fallback when city changes (only if geolocation hasn't resolved)
  useEffect(() => {
    if (!geoResolved) {
      setLocation({ lat: city.lat, lng: city.lng, isDefault: true });
    }
  }, [cityId, city.lat, city.lng, geoResolved]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isDefault: false,
        });
        setGeoResolved(true);
      },
      () => {
        // Denied or error — keep default, no-op
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Memoize so consumers get a stable reference when lat/lng haven't changed
  return useMemo(() => location, [location.lat, location.lng, location.isDefault]);
}
