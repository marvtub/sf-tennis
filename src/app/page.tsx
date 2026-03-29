"use client";

import { useState } from "react";
import { useCourts } from "@/hooks/useCourts";
import { useTravelTimes } from "@/hooks/useTravelTimes";
import { MapView } from "@/components/MapView";
import { CourtPanel } from "@/components/CourtPanel";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function Home() {
  const { courts, fetchedAt, loading, error, refresh } = useCourts();
  const travelTimes = useTravelTimes(courts);
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
          {loading && courts.length > 0 && (
            <span className="animate-pulse">Refreshing...</span>
          )}
          {fetchedAt && !loading && (
            <TimeSince isoString={fetchedAt} />
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 transition-colors"
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

      {/* Loading state */}
      {loading && courts.length === 0 && <LoadingSkeleton />}

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* Map */}
      <div className="absolute inset-0 pt-11">
        <MapView
          courts={courts}
          selectedId={selectedId}
          onSelectCourt={setSelectedId}
          travelTimes={travelTimes}
          mapboxToken={mapboxToken}
        />
      </div>

      {/* Court detail panel */}
      {selectedCourt && (
        <CourtPanel
          location={selectedCourt}
          travelTime={travelTimes.get(selectedCourt.id) ?? null}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}

/** Live-updating "Updated Xs ago" component */
import { useEffect, useState as useS } from "react";

function TimeSince({ isoString }: { isoString: string }) {
  const [, setTick] = useS(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.round(
    (Date.now() - new Date(isoString).getTime()) / 1000
  );
  let label: string;
  if (seconds < 60) label = `${seconds}s ago`;
  else if (seconds < 3600) label = `${Math.round(seconds / 60)}m ago`;
  else label = `${Math.round(seconds / 3600)}h ago`;

  return <span className="text-gray-500">Updated {label}</span>;
}
