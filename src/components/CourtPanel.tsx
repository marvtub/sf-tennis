"use client";

import type { CourtLocation, TravelTime, PlayHistory, Friend } from "@/types";
import { SlotGrid } from "./SlotGrid";
import { TravelBadge } from "./TravelBadge";

interface CourtPanelProps {
  location: CourtLocation;
  travelTime: TravelTime | null;
  isFavourite: boolean;
  authenticated: boolean;
  onToggleFavourite: () => void;
  onClose: () => void;
  matchHistory: PlayHistory[];
  friends: Friend[];
  originLat: number;
  originLng: number;
}

export function CourtPanel({
  location,
  travelTime,
  isFavourite,
  authenticated,
  onToggleFavourite,
  onClose,
  matchHistory,
  friends,
  originLat,
  originLng,
}: CourtPanelProps) {
  const friendMap = new Map(friends.map((f) => [f.id, f]));
  const locationHistory = matchHistory.filter(
    (h) => h.locationId === location.id
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl border-t sm:fixed sm:left-auto sm:top-[88px] sm:bottom-0 sm:right-0 sm:w-[420px] sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
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
            originLat={originLat}
            originLng={originLng}
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

      {/* Match history for this location */}
      {locationHistory.length > 0 && (
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold mb-2">Your Matches Here</h3>
          <div className="space-y-2">
            {locationHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatDate(entry.date)}</span>
                  {entry.time && (
                    <span className="text-gray-400 text-xs">
                      {formatTime12h(entry.time)}
                    </span>
                  )}
                </div>
                {entry.courtNumber && (
                  <div className="text-xs text-gray-500">{entry.courtNumber}</div>
                )}
                {entry.friends.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {entry.friends.map((fid) => {
                      const friend = friendMap.get(fid);
                      return friend ? (
                        <span
                          key={fid}
                          className="text-xs text-blue-600"
                        >
                          {friend.emoji} {friend.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {entry.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking link */}
      <div className="px-4 py-3">
        <a
          href={`https://www.rec.us/locations/${location.id}?tab=calendar`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          Open calendar on rec.us →
        </a>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00-07:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
