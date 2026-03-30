"use client";

import type { TravelTime } from "@/types";

interface TravelBadgeProps {
  travelTime: TravelTime;
  destLat: number;
  destLng: number;
  originLat: number;
  originLng: number;
}

function gmapsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: "walking" | "driving" | "transit"
) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${mode}`;
}

export function TravelBadge({ travelTime, destLat, destLng, originLat, originLng }: TravelBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      {travelTime.walking && (
        <a
          href={gmapsUrl(originLat, originLng, destLat, destLng, "walking")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
        >
          🚶 {travelTime.walking.durationMinutes} min →
        </a>
      )}
      {travelTime.driving && (
        <a
          href={gmapsUrl(originLat, originLng, destLat, destLng, "driving")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
        >
          🚗 {travelTime.driving.durationMinutes} min →
        </a>
      )}
      <a
        href={gmapsUrl(originLat, originLng, destLat, destLng, "transit")}
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
