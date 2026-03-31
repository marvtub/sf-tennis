"use client";

import { useState } from "react";
import { FilterBar } from "./FilterBar";
import { TimeSince } from "./TimeSince";
import type { AvailabilityFilter, Friend } from "@/types";

interface TopBarProps {
  loading: boolean;
  hasData: boolean;
  fetchedAt: string | null;
  authenticated: boolean;
  filter: AvailabilityFilter;
  onFilterChange: (filter: AvailabilityFilter) => void;
  availableDates: string[];
  friends: Friend[];
  viewMode: "map" | "list";
  onRefresh: () => void;
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
  filter,
  onFilterChange,
  availableDates,
  friends,
  viewMode,
  onRefresh,
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

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">🎾 SF Tennis Courts</h1>

          {/* Search button */}
          <button
            onClick={onShowSearch}
            aria-label="Search courts"
            className="hidden sm:flex items-center gap-2 px-3 py-1 text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 border rounded-lg transition-colors"
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
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          {loading && hasData && (
            <span className="animate-pulse">Refreshing...</span>
          )}
          {fetchedAt && !loading && <TimeSince isoString={fetchedAt} />}

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

      {/* Filter bar */}
      <div className="px-4 pb-2">
        <FilterBar
          filter={filter}
          onChange={onFilterChange}
          availableDates={availableDates}
        />
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
