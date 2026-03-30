"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { CourtLocation, TravelTime } from "@/types";

interface CommandSearchProps {
  courts: CourtLocation[];
  travelTimes: Map<string, TravelTime>;
  favourites: Set<string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CommandSearch({
  courts,
  travelTimes,
  favourites,
  onSelect,
  onClose,
}: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fuzzy filter + sort by distance
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q
      ? courts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q)
        )
      : courts;

    return [...filtered].sort((a, b) => {
      const aDist = travelTimes.get(a.id)?.walking?.durationMinutes ?? 999;
      const bDist = travelTimes.get(b.id)?.walking?.durationMinutes ?? 999;
      return aDist - bDist;
    });
  }, [courts, query, travelTimes]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        onSelect(results[selectedIndex].id);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [results, selectedIndex, onSelect, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courts..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No courts found
            </div>
          ) : (
            results.map((court, i) => {
              const travel = travelTimes.get(court.id);
              const walkMin = travel?.walking?.durationMinutes;
              const isFav = favourites.has(court.id);

              return (
                <button
                  key={court.id}
                  onClick={() => {
                    onSelect(court.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    i === selectedIndex
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Availability dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      court.availabilityStatus === "available"
                        ? "bg-green-500"
                        : court.availabilityStatus === "later"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {isFav && "⭐ "}
                      {court.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {court.address}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-500">
                    {walkMin != null && (
                      <span>🚶 {walkMin}m</span>
                    )}
                    <span className="text-gray-300">
                      {court.totalSlotsToday > 0
                        ? `${court.totalSlotsToday} today`
                        : `${court.totalSlotsWeek} this wk`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
