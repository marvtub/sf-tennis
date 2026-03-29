"use client";

import { useState, useMemo } from "react";
import type { Court, TimeSlot } from "@/types";

interface SlotGridProps {
  courts: Court[];
}

export function SlotGrid({ courts }: SlotGridProps) {
  // Get all unique dates across all courts
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    for (const court of courts) {
      for (const slot of court.availableSlots) {
        dateSet.add(slot.date);
      }
    }
    return Array.from(dateSet).sort();
  }, [courts]);

  const [selectedDate, setSelectedDate] = useState<string>(
    allDates[0] ?? getTodaySF()
  );

  if (allDates.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <p className="font-medium">No courts available this week</p>
        <p className="text-xs mt-1">Check back tomorrow — slots open 7 days out at 8:00 AM</p>
      </div>
    );
  }

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
        {allDates.map((date) => {
          const slotsOnDate = courts.reduce(
            (sum, c) =>
              sum + c.availableSlots.filter((s) => s.date === date).length,
            0
          );
          const isToday = date === getTodaySF();
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              <div>{formatDateShort(date)}</div>
              <div className={`text-[10px] ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                {slotsOnDate} slot{slotsOnDate !== 1 ? "s" : ""}
                {isToday && " · today"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Court slots for selected date */}
      {courts.map((court) => {
        const daySlots = court.availableSlots.filter(
          (s) => s.date === selectedDate
        );

        return (
          <div key={court.id} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {court.courtNumber}
              </span>
              <span className="text-xs text-gray-400">
                ${court.priceCentsPerHour / 100}/hr ·{" "}
                {court.allowedDurations.join("/")}min
              </span>
            </div>
            {daySlots.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No slots</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {daySlots.map((slot) => (
                  <a
                    key={slot.datetime}
                    href={court.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    {slot.time}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getTodaySF(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00-07:00"); // PT approximate
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}
