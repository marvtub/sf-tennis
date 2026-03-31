"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useCourts } from "@/hooks/useCourts";
import { useTravelTimes } from "@/hooks/useTravelTimes";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { useFriends } from "@/hooks/useFriends";
import { useHistory } from "@/hooks/useHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TopBar } from "@/components/TopBar";
import { MapView } from "@/components/MapView";
import { LocationList } from "@/components/LocationList";
import { CourtPanel } from "@/components/CourtPanel";
import { CommandSearch } from "@/components/CommandSearch";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoginDialog } from "@/components/LoginDialog";
import { AddFriendDialog } from "@/components/AddFriendDialog";
import { AddHistoryDialog } from "@/components/AddHistoryDialog";
import { HistoryPanel } from "@/components/HistoryPanel";
import { applyFilter, getAvailableDates } from "@/lib/filter";
import type { AvailabilityFilter } from "@/types";

export default function Home() {
  // Data hooks
  const { courts: rawCourts, fetchedAt, loading, error, refresh } = useCourts();
  const userLocation = useUserLocation();
  const travelTimes = useTravelTimes(rawCourts, userLocation);
  const auth = useAuth();
  const { favourites, toggleFavourite } = useFavourites();
  const { friends, addFriend, removeFriend } = useFriends();
  const { history, addEntry, deleteEntry } = useHistory(auth.authenticated);

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AvailabilityFilter>({
    date: null,
    timeFrom: null,
    timeTo: null,
  });
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showSearch, setShowSearch] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ⌘K / Ctrl+K shortcut
  const handleSearchSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Derived data
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const availableDates = useMemo(
    () => getAvailableDates(rawCourts),
    [rawCourts]
  );
  const courts = useMemo(
    () => applyFilter(rawCourts, filter),
    [rawCourts, filter]
  );
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
      <TopBar
        loading={loading}
        hasData={rawCourts.length > 0}
        fetchedAt={fetchedAt}
        authenticated={auth.authenticated}
        filter={filter}
        onFilterChange={setFilter}
        availableDates={availableDates}
        friends={friends}
        viewMode={viewMode}
        onRefresh={refresh}
        onToggleView={() => setViewMode((m) => (m === "map" ? "list" : "map"))}
        onShowSearch={() => setShowSearch(true)}
        onShowLogin={() => setShowLogin(true)}
        onShowAddFriend={() => setShowAddFriend(true)}
        onShowAddHistory={() => setShowAddHistory(true)}
        onShowHistory={() => setShowHistory(true)}
        onLogout={auth.logout}
        onRemoveFriend={removeFriend}
      />

      {/* Loading state */}
      {loading && rawCourts.length === 0 && <LoadingSkeleton />}

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* Main content with error boundary */}
      <div className="absolute inset-0 pt-[88px]">
        <ErrorBoundary>
          {viewMode === "map" ? (
            <MapView
              courts={courts}
              friends={friends}
              favourites={favourites}
              selectedId={selectedId}
              onSelectCourt={setSelectedId}
              travelTimes={travelTimes}
              mapboxToken={mapboxToken}
              userLocation={userLocation}
            />
          ) : (
            <LocationList
              courts={courts}
              travelTimes={travelTimes}
              favourites={favourites}
              onSelectCourt={setSelectedId}
              selectedId={selectedId}
              loading={travelTimes.size === 0 && rawCourts.length > 0}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Court detail panel */}
      {selectedCourt && (
        <CourtPanel
          location={selectedCourt}
          travelTime={travelTimes.get(selectedCourt.id) ?? null}
          isFavourite={favourites.has(selectedCourt.id)}
          authenticated={auth.authenticated}
          onToggleFavourite={() => toggleFavourite(selectedCourt.id)}
          onClose={() => setSelectedId(null)}
          matchHistory={history}
          friends={friends}
          originLat={userLocation.lat}
          originLng={userLocation.lng}
        />
      )}

      {/* Dialogs */}
      {showLogin && (
        <LoginDialog
          onLogin={async (pin) => {
            const ok = await auth.login(pin);
            if (ok) setShowLogin(false);
            return ok;
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showAddFriend && (
        <AddFriendDialog
          onAdd={addFriend}
          onClose={() => setShowAddFriend(false)}
          mapboxToken={mapboxToken}
        />
      )}

      {showAddHistory && (
        <AddHistoryDialog
          locations={rawCourts}
          friends={friends}
          onAdd={addEntry}
          onClose={() => setShowAddHistory(false)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          history={history}
          friends={friends}
          onDelete={deleteEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ⌘K Search */}
      {showSearch && (
        <CommandSearch
          courts={courts}
          travelTimes={travelTimes}
          favourites={favourites}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </main>
  );
}
