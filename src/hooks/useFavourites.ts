"use client";

import { useState, useEffect, useCallback } from "react";

export function useFavourites() {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favourites")
      .then((r) => r.json())
      .then((d) => setFavourites(new Set(d.favourites)))
      .catch(() => {});
  }, []);

  const toggleFavourite = useCallback(
    async (locationId: string) => {
      const isFav = favourites.has(locationId);
      const method = isFav ? "DELETE" : "POST";

      // Optimistic update
      setFavourites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(locationId);
        else next.add(locationId);
        return next;
      });

      try {
        const res = await fetch("/api/favourites", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId }),
        });
        if (!res.ok) {
          // Revert on failure
          setFavourites((prev) => {
            const next = new Set(prev);
            if (isFav) next.add(locationId);
            else next.delete(locationId);
            return next;
          });
        }
      } catch {
        // Revert
        setFavourites((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(locationId);
          else next.delete(locationId);
          return next;
        });
      }
    },
    [favourites]
  );

  return { favourites, toggleFavourite };
}
