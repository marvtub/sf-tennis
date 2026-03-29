"use client";

import { useState } from "react";

interface AddFriendDialogProps {
  onAdd: (friend: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    emoji: string;
  }) => Promise<boolean>;
  onClose: () => void;
  mapboxToken: string;
}

const EMOJI_OPTIONS = ["👩", "👨", "🧑", "👧", "👦", "🎾", "🏃", "⭐"];

export function AddFriendDialog({
  onAdd,
  onClose,
  mapboxToken,
}: AddFriendDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Geocode address using Mapbox
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${mapboxToken}&limit=1`;
      const res = await fetch(geocodeUrl);
      const data = await res.json();

      if (!data.features?.length) {
        setError("Could not find that address. Try a more specific one.");
        setLoading(false);
        return;
      }

      const [lng, lat] = data.features[0].center;
      const fullAddress = data.features[0].place_name;

      const ok = await onAdd({
        name: name.trim(),
        address: fullAddress,
        lat,
        lng,
        emoji,
      });

      if (!ok) {
        setError("Failed to save. Are you logged in?");
      } else {
        onClose();
      }
    } catch {
      setError("Failed to geocode address.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add Friend</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gabriella"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Valencia St, SF"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="flex gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all ${
                    emoji === e
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !address.trim()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Looking up address..." : "Add Friend"}
          </button>
        </form>
      </div>
    </div>
  );
}
