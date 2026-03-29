"use client";

import type { TravelTime } from "@/types";

interface TravelBadgeProps {
  travelTime: TravelTime;
}

export function TravelBadge({ travelTime }: TravelBadgeProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {travelTime.walking && (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
          🚶 {travelTime.walking.durationMinutes} min
        </span>
      )}
      {travelTime.driving && (
        <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
          🚗 {travelTime.driving.durationMinutes} min
        </span>
      )}
      <a
        href={travelTime.transitUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
      >
        🚌 Transit →
      </a>
    </div>
  );
}

/** Compact badge for map pins */
export function TravelBadgeMini({
  travelTime,
}: {
  travelTime: TravelTime | undefined;
}) {
  if (!travelTime?.walking) return null;
  return (
    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-white/90 rounded text-[10px] font-medium text-gray-700 shadow-sm border">
      🚶 {travelTime.walking.durationMinutes}m
    </div>
  );
}
