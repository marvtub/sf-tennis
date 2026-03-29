"use client";

import { useMemo } from "react";
import type { AvailabilityFilter } from "@/types";

interface FilterBarProps {
  filter: AvailabilityFilter;
  onChange: (filter: AvailabilityFilter) => void;
  availableDates: string[];
}

export function FilterBar({ filter, onChange, availableDates }: FilterBarProps) {
  const dateOptions = useMemo(() => {
    return availableDates.map((d) => ({
      value: d,
      label: formatDateLabel(d),
    }));
  }, [availableDates]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Day filter */}
      <select
        value={filter.date ?? ""}
        onChange={(e) =>
          onChange({ ...filter, date: e.target.value || null })
        }
        className="px-2 py-1.5 text-xs bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Any day</option>
        {dateOptions.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      {/* Time from */}
      <select
        value={filter.timeFrom ?? ""}
        onChange={(e) =>
          onChange({ ...filter, timeFrom: e.target.value || null })
        }
        className="px-2 py-1.5 text-xs bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">From</option>
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {formatTime12h(t)}
          </option>
        ))}
      </select>

      <span className="text-xs text-gray-400">–</span>

      {/* Time to */}
      <select
        value={filter.timeTo ?? ""}
        onChange={(e) =>
          onChange({ ...filter, timeTo: e.target.value || null })
        }
        className="px-2 py-1.5 text-xs bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">To</option>
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {formatTime12h(t)}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {(filter.date || filter.timeFrom || filter.timeTo) && (
        <button
          onClick={() =>
            onChange({ date: null, timeFrom: null, timeTo: null })
          }
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

const TIME_OPTIONS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00",
];

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
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
