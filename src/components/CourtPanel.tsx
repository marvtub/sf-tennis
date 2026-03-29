"use client";

import type { CourtLocation, TravelTime } from "@/types";
import { SlotGrid } from "./SlotGrid";
import { TravelBadge } from "./TravelBadge";

interface CourtPanelProps {
  location: CourtLocation;
  travelTime: TravelTime | null;
  isFavourite: boolean;
  authenticated: boolean;
  onToggleFavourite: () => void;
  onClose: () => void;
}

export function CourtPanel({
  location,
  travelTime,
  isFavourite,
  authenticated,
  onToggleFavourite,
  onClose,
}: CourtPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl border-t sm:left-auto sm:top-11 sm:bottom-0 sm:right-0 sm:w-[420px] sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-start justify-between z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold truncate">{location.name}</h2>
            {authenticated && (
              <button
                onClick={onToggleFavourite}
                className={`text-xl transition-transform hover:scale-110 ${
                  isFavourite ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                }`}
                title={isFavourite ? "Remove from favourites" : "Add to favourites"}
              >
                {isFavourite ? "★" : "☆"}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{location.address}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-2 hover:bg-gray-100 rounded-full text-gray-400 flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Quick stats + travel */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
          <div>
            <div className="font-bold text-lg">{location.courts.length}</div>
            <div className="text-gray-500">Courts</div>
          </div>
          <div>
            <div className="font-bold text-lg text-green-600">
              {location.totalSlotsToday}
            </div>
            <div className="text-gray-500">Today</div>
          </div>
          <div>
            <div className="font-bold text-lg">{location.totalSlotsWeek}</div>
            <div className="text-gray-500">This week</div>
          </div>
        </div>

        {/* Travel times */}
        {travelTime && (
          <TravelBadge
            travelTime={travelTime}
            destLat={location.lat}
            destLng={location.lng}
          />
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-b space-y-1.5 text-sm">
        <p>
          <span className="text-gray-500">Hours:</span>{" "}
          {location.hoursOfOperation}
        </p>
        {location.gettingThereInfo && (
          <p>
            <span className="text-gray-500">Getting there:</span>{" "}
            {location.gettingThereInfo}
          </p>
        )}
        {location.accessInfo && (
          <p>
            <span className="text-gray-500">Access:</span>{" "}
            {location.accessInfo}
          </p>
        )}
      </div>

      {/* 7-day availability grid */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold mb-2">Available Slots</h3>
        <SlotGrid courts={location.courts} />
      </div>

      {/* Booking link */}
      <div className="px-4 py-3">
        <a
          href={`https://www.rec.us/locations/${location.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          Book on rec.us →
        </a>
      </div>
    </div>
  );
}
