"use client";

import { useState } from "react";
import { TimeSince } from "./TimeSince";
import type { Friend } from "@/types";
import type { Sport, CityId } from "@/lib/constants";
import { CITIES } from "@/lib/constants";

interface TopBarProps {
  loading: boolean;
  hasData: boolean;
  fetchedAt: string | null;
  authenticated: boolean;
  friends: Friend[];
  viewMode: "map" | "list";
  sport: Sport;
  city: CityId;
  courtCount: number;
  userLocationStatus: "idle" | "requesting" | "resolved" | "fallback" | "denied" | "unsupported";
  onRefresh: () => void;
  onRequestLocation: () => void;
  onToggleView: () => void;
  onShowSearch: () => void;
  onShowLogin: () => void;
  onShowAddFriend: () => void;
  onShowAddHistory: () => void;
  onShowHistory: () => void;
  onLogout: () => void;
  onRemoveFriend: (id: string) => void;
}

export function TopBar({
  loading,
  hasData,
  fetchedAt,
  authenticated,
  friends,
  viewMode,
  sport,
  city,
  courtCount,
  userLocationStatus,
  onRefresh,
  onRequestLocation,
  onToggleView,
  onShowSearch,
  onShowLogin,
  onShowAddFriend,
  onShowAddHistory,
  onShowHistory,
  onLogout,
  onRemoveFriend,
}: TopBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const cityConfig = CITIES[city];
  const sportEmoji = sport === "tennis" ? "🎾" : "🏓";
  const sportLabel = sport === "tennis" ? "Tennis" : "Pickleball";
  const locationLabel =
    userLocationStatus === "requesting"
      ? "Locating…"
      : userLocationStatus === "resolved"
      ? "My location"
      : userLocationStatus === "denied"
      ? "Location blocked"
      : userLocationStatus === "unsupported"
      ? "Location unavailable"
      : "Use my location";

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: title + search trigger */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-bold truncate">
            {sportEmoji} {cityConfig?.shortLabel ?? city} {sportLabel}
          </h1>
          <span className="text-xs text-gray-400 hidden sm:inline">
            · {courtCount} court{courtCount !== 1 ? "s" : ""}
          </span>

          {/* Search trigger */}
          <button
            onClick={onShowSearch}
            aria-label="Search courts"
            className="hidden sm:flex items-center gap-2 px-3 py-1 text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 border rounded-lg transition-colors ml-1"
          >
            🔍 Search
            <kbd className="px-1 py-0.5 text-[10px] font-medium bg-white border rounded">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={onShowSearch}
            aria-label="Search courts"
            className="sm:hidden px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            🔍
          </button>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-shrink-0">
          {loading && hasData && (
            <span className="animate-pulse text-xs">Refreshing...</span>
          )}
          {fetchedAt && !loading && (
            <span className="hidden sm:inline">
              <TimeSince isoString={fetchedAt} />
            </span>
          )}

          {/* Auth-gated refresh */}
          {authenticated && (
            <button
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh courts"
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 transition-colors"
            >
              ↻
            </button>
          )}

          <button
            onClick={onRequestLocation}
            disabled={userLocationStatus === "requesting"}
            aria-label={locationLabel}
            title={locationLabel}
            className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 ${
              userLocationStatus === "resolved"
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : userLocationStatus === "denied"
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : userLocationStatus === "unsupported"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {userLocationStatus === "requesting" ? "📡" : "📍"}
          </button>

          {/* Map/List toggle */}
          <button
            onClick={onToggleView}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            aria-label={
              viewMode === "map" ? "Switch to list view" : "Switch to map view"
            }
          >
            {viewMode === "map" ? "📋" : "🗺️"}
          </button>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu"
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
                  {authenticated ? (
                    <>
                      <MenuButton
                        onClick={() => {
                          onShowAddFriend();
                          setShowMenu(false);
                        }}
                      >
                        👤 Add Friend
                      </MenuButton>
                      <MenuButton
                        onClick={() => {
                          onShowAddHistory();
                          setShowMenu(false);
                        }}
                      >
                        🎾 Log Match
                      </MenuButton>
                      <MenuButton
                        onClick={() => {
                          onShowHistory();
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
                                onClick={() => onRemoveFriend(f.id)}
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
                          onLogout();
                          setShowMenu(false);
                        }}
                      >
                        🔓 Logout
                      </MenuButton>
                    </>
                  ) : (
                    <MenuButton
                      onClick={() => {
                        onShowLogin();
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
    </div>
  );
}

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
