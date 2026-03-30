"use client";

import { useState, useEffect } from "react";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/lib/constants";

export interface UserLocation {
  lat: number;
  lng: number;
  isDefault: boolean; // true = fallback to hardcoded home
}

/**
 * One-shot browser geolocation.
 * Falls back silently to DEFAULT_LAT/DEFAULT_LNG on denial or error.
 */
export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    isDefault: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isDefault: false,
        });
      },
      () => {
        // Denied or error — keep default, no-op
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return location;
}
