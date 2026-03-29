"use client";

import { useState } from "react";
import type { CourtLocation, Friend } from "@/types";

interface AddHistoryDialogProps {
  locations: CourtLocation[];
  friends: Friend[];
  onAdd: (entry: {
    locationId: string;
    locationName: string;
    courtNumber?: string;
    date: string;
    time?: string;
    friends?: string[];
    notes?: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export function AddHistoryDialog({
  locations,
  friends,
  onAdd,
  onClose,
}: AddHistoryDialogProps) {
  const [locationId, setLocationId] = useState("");
  const [courtNumber, setCourtNumber] = useState("");
  const [date, setDate] = useState(getTodaySF());
  const [time, setTime] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(
    new Set()
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedLocation = locations.find((l) => l.id === locationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !date) return;

    setLoading(true);
    const ok = await onAdd({
      locationId,
      locationName:
        selectedLocation?.name ?? "Unknown",
      courtNumber: courtNumber || undefined,
      date,
      time: time || undefined,
      friends: Array.from(selectedFriends),
      notes: notes.trim() || undefined,
    });

    if (ok) onClose();
    setLoading(false);
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-96 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🎾 Log a Match</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where
            </label>
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setCourtNumber("");
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select court location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Court number */}
          {selectedLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court (optional)
              </label>
              <select
                value={courtNumber}
                onChange={(e) => setCourtNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any court</option>
                {selectedLocation.courts.map((c) => (
                  <option key={c.id} value={c.courtNumber}>
                    {c.courtNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Friends */}
          {friends.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Played with
              </label>
              <div className="flex flex-wrap gap-1">
                {friends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedFriends.has(f.id)
                        ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Great match, need to work on backhand..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !locationId || !date}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Match"}
          </button>
        </form>
      </div>
    </div>
  );
}

function getTodaySF(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}
