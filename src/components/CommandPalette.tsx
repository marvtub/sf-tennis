"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { CourtLocation, TravelTime, AvailabilityFilter } from "@/types";
import type { Sport, CityId, CityConfig } from "@/lib/constants";
import { CITIES } from "@/lib/constants";

interface CommandPaletteProps {
  courts: CourtLocation[];
  travelTimes: Map<string, TravelTime>;
  favourites: Set<string>;
  sport: Sport;
  city: CityId;
  filter: AvailabilityFilter;
  availableDates: string[];
  onSelectCourt: (id: string) => void;
  onSportChange: (sport: Sport) => void;
  onCityChange: (city: CityId) => void;
  onFilterChange: (filter: AvailabilityFilter) => void;
  onClose: () => void;
}

export function CommandPalette({
  courts,
  travelTimes,
  favourites,
  sport,
  city,
  filter,
  availableDates,
  onSelectCourt,
  onSportChange,
  onCityChange,
  onFilterChange,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build flat item list: settings sections + court results
  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result: PaletteItem[] = [];

    // When no query, show settings + courts
    // When query, only show matching courts
    if (!q) {
      // City section
      const cityEntries = Object.entries(CITIES) as [CityId, CityConfig][];
      for (const [id, c] of cityEntries) {
        result.push({
          type: "city",
          id: `city-${id}`,
          cityId: id,
          label: c.label,
          active: id === city,
        });
      }

      // Sport section
      result.push({
        type: "sport",
        id: "sport-tennis",
        sport: "tennis",
        label: "🎾 Tennis",
        active: sport === "tennis",
      });
      result.push({
        type: "sport",
        id: "sport-pickleball",
        sport: "pickleball",
        label: "🏓 Pickleball",
        active: sport === "pickleball",
      });

      // Date filter shortcuts
      result.push({
        type: "filter",
        id: "filter-any",
        label: "Any day",
        active: !filter.date,
        filterValue: { date: null, timeFrom: null, timeTo: null },
      });
      for (const d of availableDates.slice(0, 5)) {
        result.push({
          type: "filter",
          id: `filter-${d}`,
          label: formatDateLabel(d),
          active: filter.date === d,
          filterValue: { ...filter, date: d },
        });
      }

      // Time-of-day shortcuts
      const timePresets: { id: string; label: string; from: string; to: string }[] = [
        { id: "morning", label: "🌅 Morning (7–12)", from: "07:00", to: "12:00" },
        { id: "afternoon", label: "☀️ Afternoon (12–17)", from: "12:00", to: "17:00" },
        { id: "evening", label: "🌆 Evening (17–21)", from: "17:00", to: "21:00" },
      ];
      result.push({
        type: "filter",
        id: "time-any",
        label: "Any time",
        active: !filter.timeFrom && !filter.timeTo,
        filterValue: { ...filter, timeFrom: null, timeTo: null },
      });
      for (const tp of timePresets) {
        result.push({
          type: "filter",
          id: `time-${tp.id}`,
          label: tp.label,
          active: filter.timeFrom === tp.from && filter.timeTo === tp.to,
          filterValue: { ...filter, timeFrom: tp.from, timeTo: tp.to },
        });
      }
    }

    // Courts — always shown, filtered by query
    const filtered = q
      ? courts.filter(
          (c) =>
            (c.name ?? "").toLowerCase().includes(q) ||
            (c.address ?? "").toLowerCase().includes(q)
        )
      : courts;

    const sorted = [...filtered].sort((a, b) => {
      const aDist = travelTimes.get(a.id)?.walking?.durationMinutes ?? 999;
      const bDist = travelTimes.get(b.id)?.walking?.durationMinutes ?? 999;
      return aDist - bDist;
    });

    for (const court of sorted) {
      result.push({
        type: "court",
        id: court.id,
        court,
        walkMin: travelTimes.get(court.id)?.walking?.durationMinutes ?? null,
        isFav: favourites.has(court.id),
      });
    }

    return result;
  }, [courts, query, travelTimes, favourites, sport, city, filter, availableDates]);

  // Reset selection when items change
  useEffect(() => {
    // Jump to first court when there's a query
    if (query) {
      setSelectedIndex(0);
    } else {
      // Jump past settings to first court
      const firstCourt = items.findIndex((i) => i.type === "court");
      setSelectedIndex(firstCourt >= 0 ? firstCourt : 0);
    }
  }, [items, query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function handleSelect(item: PaletteItem) {
    if (item.type === "court") {
      onSelectCourt(item.court.id);
      onClose();
    } else if (item.type === "sport") {
      onSportChange(item.sport);
    } else if (item.type === "city") {
      onCityChange(item.cityId);
    } else if (item.type === "filter") {
      onFilterChange(item.filterValue);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && items.length > 0) {
        e.preventDefault();
        handleSelect(items[selectedIndex]);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items, selectedIndex, onClose]);

  // Section headers
  let lastType = "";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
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
            placeholder="Search courts, change city or sport..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border rounded">
            ESC
          </kbd>
        </div>

        {/* Active settings pills */}
        {!query && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-gray-50/50 flex-wrap">
            <Pill active>{CITIES[city]?.shortLabel ?? city}</Pill>
            <Pill active>{sport === "tennis" ? "🎾 Tennis" : "🏓 Pickleball"}</Pill>
            {filter.date && (
              <Pill
                active
                onRemove={() =>
                  onFilterChange({ ...filter, date: null })
                }
              >
                {formatDateLabel(filter.date)}
              </Pill>
            )}
            {filter.timeFrom && (
              <Pill
                active
                onRemove={() =>
                  onFilterChange({ ...filter, timeFrom: null, timeTo: null })
                }
              >
                {filter.timeFrom}–{filter.timeTo ?? ""}
              </Pill>
            )}
            <span className="text-xs text-gray-400 ml-1">
              {courts.length} court{courts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results found
            </div>
          ) : (
            items.map((item, i) => {
              // Section headers
              let header: string | null = null;
              const itemKey = item.type === "filter" && item.id.startsWith("time-")
                ? "time" : item.type;
              if (itemKey !== lastType) {
                lastType = itemKey;
                if (itemKey === "city") header = "📍 City";
                else if (itemKey === "sport") header = "🏅 Sport";
                else if (itemKey === "filter") header = "📅 Day";
                else if (itemKey === "time") header = "⏰ Time";
                else if (itemKey === "court")
                  header = query ? "Courts" : "🏟️ Courts";
              }

              return (
                <div key={item.id}>
                  {header && (
                    <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {header}
                    </div>
                  )}
                  {item.type === "court" ? (
                    <CourtRow
                      item={item}
                      isSelected={i === selectedIndex}
                      idx={i}
                      onSelect={() => handleSelect(item)}
                      onHover={() => setSelectedIndex(i)}
                    />
                  ) : (
                    <SettingRow
                      item={item}
                      isSelected={i === selectedIndex}
                      idx={i}
                      onSelect={() => handleSelect(item)}
                      onHover={() => setSelectedIndex(i)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Item types ──

type PaletteItem =
  | { type: "city"; id: string; cityId: CityId; label: string; active: boolean }
  | { type: "sport"; id: string; sport: Sport; label: string; active: boolean }
  | {
      type: "filter";
      id: string;
      label: string;
      active: boolean;
      filterValue: AvailabilityFilter;
    }
  | {
      type: "court";
      id: string;
      court: CourtLocation;
      walkMin: number | null;
      isFav: boolean;
    };

// ── Row components ──

function SettingRow({
  item,
  isSelected,
  idx,
  onSelect,
  onHover,
}: {
  item: PaletteItem;
  isSelected: boolean;
  idx: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  if (item.type === "court") return null;
  return (
    <button
      data-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <span className={item.active ? "font-medium text-gray-900" : "text-gray-600"}>
        {item.label}
      </span>
      {item.active && (
        <span className="text-blue-600 text-xs font-medium">✓</span>
      )}
    </button>
  );
}

function CourtRow({
  item,
  isSelected,
  idx,
  onSelect,
  onHover,
}: {
  item: Extract<PaletteItem, { type: "court" }>;
  isSelected: boolean;
  idx: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  const { court, walkMin, isFav } = item;
  return (
    <button
      data-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
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
        <div className="text-xs text-gray-500 truncate">{court.address}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
        {walkMin != null && <span>🚶 {walkMin}m</span>}
        <span>
          {court.totalSlotsToday > 0
            ? `${court.totalSlotsToday} today`
            : `${court.totalSlotsWeek} wk`}
        </span>
      </div>
    </button>
  );
}

// ── Helpers ──

function Pill({
  children,
  active,
  onRemove,
}: {
  children: React.ReactNode;
  active?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
        active
          ? "bg-blue-100 text-blue-700 font-medium"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-blue-900 ml-0.5"
        >
          ✕
        </button>
      )}
    </span>
  );
}

function formatDateLabel(dateStr: string): string {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  if (dateStr === today) return "Today";

  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  if (dateStr === tomorrow) return "Tomorrow";

  const date = new Date(dateStr + "T12:00:00-07:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}
