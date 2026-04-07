"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

type MobileTab = "courts" | "city" | "sport" | "day" | "time";

const TIME_PRESETS: { id: string; label: string; from: string; to: string }[] = [
  { id: "morning", label: "🌅 Morning", from: "07:00", to: "12:00" },
  { id: "afternoon", label: "☀️ Afternoon", from: "12:00", to: "17:00" },
  { id: "evening", label: "🌆 Evening", from: "17:00", to: "21:00" },
];

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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("courts");

  // Debounce query (150ms) so filtering doesn't run on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Track viewport via matchMedia (stays in sync on resize/rotate)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Focus input on mount (desktop only — mobile keyboard would push content)
  useEffect(() => {
    if (isDesktop) {
      inputRef.current?.focus();
    }
  }, [isDesktop]);

  // Lock body scroll while open + restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Focus trap: keep Tab navigation inside the modal
  useEffect(() => {
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, []);

  // Filtered + sorted courts (shared between mobile and desktop)
  const sortedCourts = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    const filtered = q
      ? courts.filter(
          (c) =>
            (c.name ?? "").toLowerCase().includes(q) ||
            (c.address ?? "").toLowerCase().includes(q)
        )
      : courts;

    return [...filtered].sort((a, b) => {
      const aDist = travelTimes.get(a.id)?.walking?.durationMinutes ?? 999;
      const bDist = travelTimes.get(b.id)?.walking?.durationMinutes ?? 999;
      return aDist - bDist;
    });
  }, [courts, debouncedQuery, travelTimes]);

  // Desktop items (all sections inline)
  const desktopItems = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    const result: PaletteItem[] = [];

    if (!q) {
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
      result.push({
        type: "filter",
        id: "filter-any",
        label: "Any day",
        active: !filter.date,
        filterValue: { ...filter, date: null },
      });
      for (const d of availableDates) {
        result.push({
          type: "filter",
          id: `filter-${d}`,
          label: formatDateLabel(d),
          active: filter.date === d,
          filterValue: { ...filter, date: d },
        });
      }
      result.push({
        type: "filter",
        id: "time-any",
        label: "Any time",
        active: !filter.timeFrom && !filter.timeTo,
        filterValue: { ...filter, timeFrom: null, timeTo: null },
      });
      for (const tp of TIME_PRESETS) {
        result.push({
          type: "filter",
          id: `time-${tp.id}`,
          label: tp.label,
          active: filter.timeFrom === tp.from && filter.timeTo === tp.to,
          filterValue: { ...filter, timeFrom: tp.from, timeTo: tp.to },
        });
      }
    }

    for (const court of sortedCourts) {
      result.push({
        type: "court",
        id: court.id,
        court,
        walkMin: travelTimes.get(court.id)?.walking?.durationMinutes ?? null,
        isFav: favourites.has(court.id),
      });
    }

    return result;
  }, [
    sortedCourts,
    travelTimes,
    favourites,
    sport,
    city,
    filter,
    availableDates,
    debouncedQuery,
  ]);

  // Reset desktop keyboard selection when items change
  useEffect(() => {
    if (debouncedQuery) {
      setSelectedIndex(0);
    } else {
      const firstCourt = desktopItems.findIndex((i) => i.type === "court");
      setSelectedIndex(firstCourt >= 0 ? firstCourt : 0);
    }
  }, [desktopItems, debouncedQuery]);

  // Scroll selected into view (desktop)
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
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
    },
    [onSelectCourt, onClose, onSportChange, onCityChange, onFilterChange]
  );

  // Keyboard navigation (desktop)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, desktopItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && desktopItems.length > 0) {
        e.preventDefault();
        handleSelect(desktopItems[selectedIndex]);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [desktopItems, selectedIndex, onClose, handleSelect]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and filter courts"
      className="fixed inset-0 z-[100] sm:flex sm:items-start sm:justify-center sm:pt-[12vh]"
    >
      {/* Backdrop (desktop only) */}
      <div
        className="hidden sm:block absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal / Sheet */}
      <div
        ref={modalRef}
        className="relative flex flex-col h-full sm:h-auto sm:max-h-[80vh] w-full sm:max-w-lg sm:mx-4 bg-white sm:rounded-xl sm:shadow-2xl sm:border overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0">
          {/* Mobile: close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="sm:hidden -ml-1 w-10 h-10 flex items-center justify-center text-gray-500 text-xl"
          >
            ✕
          </button>
          <span className="hidden sm:inline text-gray-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courts"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 text-base sm:text-sm outline-none placeholder:text-gray-400 bg-transparent"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border rounded">
            ESC
          </kbd>
        </div>

        {/* Active settings pills */}
        {!query && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-gray-50/50 flex-wrap flex-shrink-0">
            <Pill>{CITIES[city]?.shortLabel ?? city}</Pill>
            <Pill>{sport === "tennis" ? "🎾 Tennis" : "🏓 Pickleball"}</Pill>
            {filter.date && (
              <Pill onRemove={() => onFilterChange({ ...filter, date: null })}>
                {formatDateLabel(filter.date)}
              </Pill>
            )}
            {filter.timeFrom && (
              <Pill
                onRemove={() =>
                  onFilterChange({ ...filter, timeFrom: null, timeTo: null })
                }
              >
                {labelForTime(filter.timeFrom, filter.timeTo)}
              </Pill>
            )}
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              {sortedCourts.length} court{sortedCourts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ── DESKTOP: flat item list with all sections ── */}
        <div
          ref={listRef}
          className="hidden sm:block overflow-y-auto"
          style={{ maxHeight: "calc(80vh - 120px)" }}
        >
          <DesktopItems
            items={desktopItems}
            selectedIndex={selectedIndex}
            query={query}
            onSelect={handleSelect}
            onHover={setSelectedIndex}
          />
        </div>

        {/* ── MOBILE: tab content ── */}
        <div className="sm:hidden flex-1 overflow-y-auto">
          <MobileContent
            tab={mobileTab}
            sortedCourts={sortedCourts}
            travelTimes={travelTimes}
            favourites={favourites}
            sport={sport}
            city={city}
            filter={filter}
            availableDates={availableDates}
            onSelectCourt={(id) => {
              onSelectCourt(id);
              onClose();
            }}
            onSportChange={(s) => {
              onSportChange(s);
              setMobileTab("courts");
            }}
            onCityChange={(c) => {
              onCityChange(c);
              setMobileTab("courts");
            }}
            onFilterChange={(f) => {
              onFilterChange(f);
              setMobileTab("courts");
            }}
          />
        </div>

        {/* ── MOBILE: bottom tab bar ── */}
        <div className="sm:hidden flex border-t bg-white flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
          <MobileTabButton
            active={mobileTab === "courts"}
            onClick={() => setMobileTab("courts")}
            icon="🏟️"
            label="Courts"
          />
          <MobileTabButton
            active={mobileTab === "city"}
            onClick={() => setMobileTab("city")}
            icon="📍"
            label={CITIES[city]?.shortLabel ?? "City"}
          />
          <MobileTabButton
            active={mobileTab === "sport"}
            onClick={() => setMobileTab("sport")}
            icon={sport === "tennis" ? "🎾" : "🏓"}
            label={sport === "tennis" ? "Tennis" : "Pickleball"}
          />
          <MobileTabButton
            active={mobileTab === "day"}
            onClick={() => setMobileTab("day")}
            icon="📅"
            label={filter.date ? formatDateLabel(filter.date).split(",")[0] : "Day"}
          />
          <MobileTabButton
            active={mobileTab === "time"}
            onClick={() => setMobileTab("time")}
            icon="⏰"
            label={filter.timeFrom ? filter.timeFrom : "Time"}
          />
        </div>
      </div>
    </div>
  );
}

// ── Mobile tab content ──

function MobileContent({
  tab,
  sortedCourts,
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
}: {
  tab: MobileTab;
  sortedCourts: CourtLocation[];
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
}) {
  if (tab === "courts") {
    if (sortedCourts.length === 0) {
      return (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          No courts found
        </div>
      );
    }
    return (
      <div className="divide-y">
        {sortedCourts.map((court) => (
          <MobileCourtRow
            key={court.id}
            court={court}
            walkMin={travelTimes.get(court.id)?.walking?.durationMinutes ?? null}
            isFav={favourites.has(court.id)}
            onSelect={() => onSelectCourt(court.id)}
          />
        ))}
      </div>
    );
  }

  if (tab === "city") {
    const cityEntries = Object.entries(CITIES) as [CityId, CityConfig][];
    return (
      <div className="divide-y">
        {cityEntries.map(([id, c]) => (
          <MobileOptionRow
            key={id}
            label={c.label}
            active={id === city}
            onSelect={() => onCityChange(id)}
          />
        ))}
      </div>
    );
  }

  if (tab === "sport") {
    return (
      <div className="divide-y">
        <MobileOptionRow
          label="🎾 Tennis"
          active={sport === "tennis"}
          onSelect={() => onSportChange("tennis")}
        />
        <MobileOptionRow
          label="🏓 Pickleball"
          active={sport === "pickleball"}
          onSelect={() => onSportChange("pickleball")}
        />
      </div>
    );
  }

  if (tab === "day") {
    return (
      <div className="divide-y">
        <MobileOptionRow
          label="Any day"
          active={!filter.date}
          onSelect={() => onFilterChange({ ...filter, date: null })}
        />
        {availableDates.map((d) => (
          <MobileOptionRow
            key={d}
            label={formatDateLabel(d)}
            active={filter.date === d}
            onSelect={() => onFilterChange({ ...filter, date: d })}
          />
        ))}
      </div>
    );
  }

  if (tab === "time") {
    return (
      <div className="divide-y">
        <MobileOptionRow
          label="Any time"
          active={!filter.timeFrom && !filter.timeTo}
          onSelect={() =>
            onFilterChange({ ...filter, timeFrom: null, timeTo: null })
          }
        />
        {TIME_PRESETS.map((tp) => (
          <MobileOptionRow
            key={tp.id}
            label={`${tp.label} (${tp.from}–${tp.to})`}
            active={filter.timeFrom === tp.from && filter.timeTo === tp.to}
            onSelect={() =>
              onFilterChange({ ...filter, timeFrom: tp.from, timeTo: tp.to })
            }
          />
        ))}
      </div>
    );
  }

  return null;
}

// ── Desktop flat list ──

function DesktopItems({
  items,
  selectedIndex,
  query,
  onSelect,
  onHover,
}: {
  items: PaletteItem[];
  selectedIndex: number;
  query: string;
  onSelect: (item: PaletteItem) => void;
  onHover: (idx: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        No results found
      </div>
    );
  }

  let lastHeader = "";
  return (
    <>
      {items.map((item, i) => {
        const headerKey =
          item.type === "filter" && item.id.startsWith("time-")
            ? "time"
            : item.type;
        let header: string | null = null;
        if (headerKey !== lastHeader) {
          lastHeader = headerKey;
          if (headerKey === "city") header = "📍 City";
          else if (headerKey === "sport") header = "🏅 Sport";
          else if (headerKey === "filter") header = "📅 Day";
          else if (headerKey === "time") header = "⏰ Time";
          else if (headerKey === "court") header = query ? "Courts" : "🏟️ Courts";
        }

        return (
          <div key={item.id}>
            {header && (
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {header}
              </div>
            )}
            {item.type === "court" ? (
              <DesktopCourtRow
                item={item}
                isSelected={i === selectedIndex}
                idx={i}
                onSelect={() => onSelect(item)}
                onHover={() => onHover(i)}
              />
            ) : (
              <DesktopSettingRow
                item={item}
                isSelected={i === selectedIndex}
                idx={i}
                onSelect={() => onSelect(item)}
                onHover={() => onHover(i)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Row components ──

function MobileCourtRow({
  court,
  walkMin,
  isFav,
  onSelect,
}: {
  court: CourtLocation;
  walkMin: number | null;
  isFav: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-gray-100 min-h-[60px]"
    >
      <span
        className={`w-3 h-3 rounded-full flex-shrink-0 ${
          court.availabilityStatus === "available"
            ? "bg-green-500"
            : court.availabilityStatus === "later"
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium truncate">
          {isFav && "⭐ "}
          {court.name}
        </div>
        <div className="text-xs text-gray-500 truncate">{court.address}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-xs text-gray-500">
        {walkMin != null && <span>🚶 {walkMin}m</span>}
        <span className="text-gray-400">
          {court.totalSlotsToday > 0
            ? `${court.totalSlotsToday} today`
            : `${court.totalSlotsWeek} wk`}
        </span>
      </div>
    </button>
  );
}

function MobileOptionRow({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-4 flex items-center justify-between active:bg-gray-100 min-h-[56px]"
    >
      <span className={`text-base ${active ? "font-semibold text-blue-600" : "text-gray-800"}`}>
        {label}
      </span>
      {active && <span className="text-blue-600 text-lg">✓</span>}
    </button>
  );
}

function MobileTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-[10px] gap-0.5 transition-colors ${
        active ? "text-blue-600" : "text-gray-500 active:bg-gray-50"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium truncate max-w-full px-1">{label}</span>
    </button>
  );
}

function DesktopSettingRow({
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
      <span
        className={item.active ? "font-medium text-gray-900" : "text-gray-600"}
      >
        {item.label}
      </span>
      {item.active && (
        <span className="text-blue-600 text-xs font-medium">✓</span>
      )}
    </button>
  );
}

function DesktopCourtRow({
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

// ── Helpers ──

function Pill({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-blue-900 ml-0.5 w-4 h-4 flex items-center justify-center"
          aria-label="Remove filter"
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

function labelForTime(from: string, to: string | null): string {
  for (const tp of TIME_PRESETS) {
    if (tp.from === from && tp.to === to) return tp.label;
  }
  return `${from}${to ? `–${to}` : ""}`;
}
