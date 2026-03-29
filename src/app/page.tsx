"use client";

import { useState, useMemo } from "react";
import { useCourts } from "@/hooks/useCourts";
import { useTravelTimes } from "@/hooks/useTravelTimes";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { useFriends } from "@/hooks/useFriends";
import { useHistory } from "@/hooks/useHistory";
import { MapView } from "@/components/MapView";
import { CourtPanel } from "@/components/CourtPanel";
import { FilterBar } from "@/components/FilterBar";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoginDialog } from "@/components/LoginDialog";
import { AddFriendDialog } from "@/components/AddFriendDialog";
import { AddHistoryDialog } from "@/components/AddHistoryDialog";
import { HistoryPanel } from "@/components/HistoryPanel";
import { applyFilter, getAvailableDates } from "@/lib/filter";
import type { AvailabilityFilter } from "@/types";

export default function Home() {
  const { courts: rawCourts, fetchedAt, loading, error, refresh } = useCourts();
  const travelTimes = useTravelTimes(rawCourts);
  const auth = useAuth();
  const { favourites, toggleFavourite } = useFavourites();
  const { friends, addFriend, removeFriend } = useFriends();
  const { history, addEntry, deleteEntry } = useHistory(auth.authenticated);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AvailabilityFilter>({
    date: null,
    timeFrom: null,
    timeTo: null,
  });

  // Dialog states
  const [showLogin, setShowLogin] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  // Apply filters
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
      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-lg font-bold">🎾 SF Tennis Courts</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {loading && rawCourts.length > 0 && (
              <span className="animate-pulse">Refreshing...</span>
            )}
            {fetchedAt && !loading && <TimeSince isoString={fetchedAt} />}

            {/* Auth-gated refresh */}
            {auth.authenticated && (
              <button
                onClick={refresh}
                disabled={loading}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 transition-colors"
              >
                ↻
              </button>
            )}

            {/* Legend (desktop) */}
            <div className="hidden md:flex items-center gap-2 ml-2 border-l pl-3">
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

            {/* Menu button */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                ☰
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-[60] bg-white rounded-lg shadow-xl border py-1 w-48">
                    {auth.authenticated ? (
                      <>
                        <MenuButton
                          onClick={() => {
                            setShowAddFriend(true);
                            setShowMenu(false);
                          }}
                        >
                          👤 Add Friend
                        </MenuButton>
                        <MenuButton
                          onClick={() => {
                            setShowAddHistory(true);
                            setShowMenu(false);
                          }}
                        >
                          🎾 Log Match
                        </MenuButton>
                        <MenuButton
                          onClick={() => {
                            setShowHistory(true);
                            setShowMenu(false);
                          }}
                        >
                          📋 Match History
                        </MenuButton>
                        {friends.length > 0 && (
                          <>
                            <div className="border-t my-1" />
                            <div className="px-3 py-1 text-xs text-gray-400 font-medium">
                              Friends
                            </div>
                            {friends.map((f) => (
                              <div
                                key={f.id}
                                className="flex items-center justify-between px-3 py-1.5 text-sm"
                              >
                                <span>
                                  {f.emoji} {f.name}
                                </span>
                                <button
                                  onClick={() => removeFriend(f.id)}
                                  className="text-gray-300 hover:text-red-500 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="border-t my-1" />
                        <MenuButton
                          onClick={() => {
                            auth.logout();
                            setShowMenu(false);
                          }}
                        >
                          🔓 Logout
                        </MenuButton>
                      </>
                    ) : (
                      <MenuButton
                        onClick={() => {
                          setShowLogin(true);
                          setShowMenu(false);
                        }}
                      >
                        🔐 Login
                      </MenuButton>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 pb-2">
          <FilterBar
            filter={filter}
            onChange={setFilter}
            availableDates={availableDates}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && rawCourts.length === 0 && <LoadingSkeleton />}

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* Map */}
      <div className="absolute inset-0 pt-[88px]">
        <MapView
          courts={courts}
          friends={friends}
          favourites={favourites}
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
          isFavourite={favourites.has(selectedCourt.id)}
          authenticated={auth.authenticated}
          onToggleFavourite={() => toggleFavourite(selectedCourt.id)}
          onClose={() => setSelectedId(null)}
          matchHistory={history}
          friends={friends}
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
    </main>
  );
}

// ── Helpers ──

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}

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
