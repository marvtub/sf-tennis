"use client";

import { useState } from "react";
import { useCourts } from "@/hooks/useCourts";
import { MapView } from "@/components/MapView";
import { CourtPanel } from "@/components/CourtPanel";

export default function Home() {
  const { courts, fetchedAt, loading, error, refresh } = useCourts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  const selectedCourt = courts.find((c) => c.id === selectedId) ?? null;

  if (!mapboxToken) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">🎾 SF Tennis Courts</h1>
          <p className="text-red-600">
            Missing NEXT_PUBLIC_MAPBOX_TOKEN environment variable.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Add it to <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <h1 className="text-lg font-bold">🎾 SF Tennis Courts</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {loading && <span className="animate-pulse">Loading...</span>}
          {error && <span className="text-red-600">⚠ {error}</span>}
          {fetchedAt && !loading && (
            <span>Updated {formatTimeSince(fetchedAt)}</span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            ↻ Refresh
          </button>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 ml-2 border-l pl-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Today
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              Later
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              Full
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-11">
        <MapView
          courts={courts}
          selectedId={selectedId}
          onSelectCourt={setSelectedId}
          mapboxToken={mapboxToken}
        />
      </div>

      {/* Court detail panel */}
      {selectedCourt && (
        <CourtPanel
          location={selectedCourt}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}

function formatTimeSince(isoString: string): string {
  const seconds = Math.round(
    (Date.now() - new Date(isoString).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}
