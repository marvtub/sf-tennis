"use client";

import type { CourtLocation } from "@/types";

interface CourtPanelProps {
  location: CourtLocation;
  onClose: () => void;
}

export function CourtPanel({ location, onClose }: CourtPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[60vh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl border-t sm:left-auto sm:top-11 sm:bottom-0 sm:right-0 sm:w-96 sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{location.name}</h2>
          <p className="text-sm text-gray-500">{location.address}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-3 border-b grid grid-cols-3 gap-2 text-center text-sm">
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
          <div className="font-bold text-lg">
            {location.totalSlotsWeek}
          </div>
          <div className="text-gray-500">This week</div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <p>
          <span className="text-gray-500">Hours:</span>{" "}
          {location.hoursOfOperation}
        </p>
        <p>
          <span className="text-gray-500">Price:</span>{" "}
          ${(location.courts[0]?.priceCentsPerHour ?? 0) / 100}/hr
        </p>
        {location.gettingThereInfo && (
          <p>
            <span className="text-gray-500">Getting there:</span>{" "}
            {location.gettingThereInfo}
          </p>
        )}
      </div>

      {/* Courts + slots - expanded in Step 4 */}
      <div className="px-4 py-3 border-t">
        <h3 className="font-semibold mb-2">Available Slots</h3>
        {location.courts.map((court) => (
          <div key={court.id} className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {court.courtNumber}
            </div>
            {court.availableSlots.length === 0 ? (
              <p className="text-xs text-gray-400">No slots available</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {court.availableSlots.slice(0, 12).map((slot) => (
                  <span
                    key={slot.datetime}
                    className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded border border-green-200"
                  >
                    {slot.date.slice(5)} {slot.time}
                  </span>
                ))}
                {court.availableSlots.length > 12 && (
                  <span className="px-2 py-0.5 text-xs text-gray-400">
                    +{court.availableSlots.length - 12} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Booking link */}
      <div className="px-4 py-3 border-t">
        <a
          href={location.courts[0]?.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          Book on rec.us →
        </a>
      </div>
    </div>
  );
}
