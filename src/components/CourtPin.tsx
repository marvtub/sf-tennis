"use client";

import type { CourtLocation } from "@/types";

interface CourtPinProps {
  location: CourtLocation;
  isSelected: boolean;
  isFavourite: boolean;
  onClick: () => void;
}

const STATUS_STYLES = {
  available: {
    bg: "bg-green-500",
    border: "border-green-700",
    icon: "✓",
    label: "Available today",
  },
  later: {
    bg: "bg-yellow-500",
    border: "border-yellow-700",
    icon: "●",
    label: "Available later this week",
  },
  full: {
    bg: "bg-red-500",
    border: "border-red-700",
    icon: "✕",
    label: "Fully booked",
  },
} as const;

export function CourtPin({
  location,
  isSelected,
  isFavourite,
  onClick,
}: CourtPinProps) {
  const style = STATUS_STYLES[location.availabilityStatus];

  return (
    <button
      onClick={onClick}
      aria-label={`${location.name}: ${style.label}${isFavourite ? " (favourite)" : ""}`}
      className={`
        flex items-center justify-center
        w-11 h-11 rounded-full
        border-2 ${style.border} ${style.bg}
        text-white font-bold text-sm
        shadow-lg cursor-pointer
        transition-transform duration-150
        hover:scale-110
        ${isSelected ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""}
      `}
    >
      <span aria-hidden="true">{isFavourite ? "★" : style.icon}</span>
    </button>
  );
}

export function HomePin() {
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-800 text-white text-lg shadow-lg"
      aria-label="Home"
    >
      🏠
    </div>
  );
}

export function FriendPin({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500 border-2 border-pink-700 text-white text-lg shadow-lg"
      aria-label={`${name}'s location`}
      title={name}
    >
      {emoji}
    </div>
  );
}
