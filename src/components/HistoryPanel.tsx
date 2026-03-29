"use client";

import type { PlayHistory, Friend } from "@/types";

interface HistoryPanelProps {
  history: PlayHistory[];
  friends: Friend[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HistoryPanel({
  history,
  friends,
  onDelete,
  onClose,
}: HistoryPanelProps) {
  const friendMap = new Map(friends.map((f) => [f.id, f]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">📋 Match History</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No matches logged yet. Start playing! 🎾
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-gray-50 rounded-lg border group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {entry.locationName}
                        {entry.courtNumber && (
                          <span className="text-gray-400 font-normal">
                            {" "}
                            · {entry.courtNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(entry.date)}
                        {entry.time && ` at ${formatTime12h(entry.time)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>

                  {entry.friends.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.friends.map((fid) => {
                        const friend = friendMap.get(fid);
                        return friend ? (
                          <span
                            key={fid}
                            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full"
                          >
                            {friend.emoji} {friend.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00-07:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
