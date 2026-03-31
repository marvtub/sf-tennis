"use client";

import { useState, useMemo } from "react";
import type { CourtLocation, TravelTime } from "@/types";

type SortMode = "distance" | "name";

interface LocationListProps {
  courts: CourtLocation[];
  travelTimes: Map<string, TravelTime>;
  favourites: Set<string>;
  onSelectCourt: (id: string) => void;
  selectedId: string | null;
  loading?: boolean;
}

export function LocationList({
  courts,
  travelTimes,
  favourites,
  onSelectCourt,
  selectedId,
  loading = false,
}: LocationListProps) {
  const [sort, setSort] = useState<SortMode>("distance");
  const [search, setSearch] = useState("");

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? courts.filter(
          (c) =>
            (c.name ?? "").toLowerCase().includes(q) ||
            (c.address ?? "").toLowerCase().includes(q)
        )
      : courts;

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const aDist = travelTimes.get(a.id)?.walking?.durationMinutes ?? 999;
      const bDist = travelTimes.get(b.id)?.walking?.durationMinutes ?? 999;
      return aDist - bDist;
    });
  }, [courts, search, sort, travelTimes]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search + Sort controls */}
      <div className="px-4 py-3 bg-white border-b space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter courts..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {loading && (
            <span className="text-xs text-gray-400 animate-pulse">Loading distances...</span>
          )}
          <span className="text-xs text-gray-500 mr-1">Sort:</span>
          <SortButton
            active={sort === "distance"}
            onClick={() => setSort("distance")}
          >
            📍 Distance
          </SortButton>
          <SortButton
            active={sort === "name"}
            onClick={() => setSort("name")}
          >
            A–Z Name
          </SortButton>
          <span className="ml-auto text-xs text-gray-400">
            {filteredAndSorted.length} court{filteredAndSorted.length !== 1 && "s"}
          </span>
        </div>
      </div>

      {/* Court list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSorted.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            No courts match your search
          </div>
        ) : (
          <div className="divide-y">
            {filteredAndSorted.map((court) => {
              const travel = travelTimes.get(court.id);
              const walkMin = travel?.walking?.durationMinutes;
              const driveMin = travel?.driving?.durationMinutes;
              const isFav = favourites.has(court.id);
              const isSelected = selectedId === court.id;

              return (
                <button
                  key={court.id}
                  onClick={() => onSelectCourt(court.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "bg-white hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Availability dot */}
                    <span
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        court.availabilityStatus === "available"
                          ? "bg-green-500"
                          : court.availabilityStatus === "later"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {isFav && "⭐ "}
                          {court.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {court.address}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        {walkMin != null && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                            🚶 {walkMin} min
                          </span>
                        )}
                        {driveMin != null && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">
                            🚗 {driveMin} min
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            court.totalSlotsToday > 0
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {court.totalSlotsToday > 0
                            ? `${court.totalSlotsToday} slots today`
                            : `${court.totalSlotsWeek} this week`}
                        </span>
                        <span className="text-gray-400">
                          {court.courts.length} court{court.courts.length !== 1 && "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 font-medium"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
