"use client";

import { useState, useEffect } from "react";

export function formatTimeSince(isoString: string, now = Date.now()) {
  const timestamp = Date.parse(isoString);
  if (!Number.isFinite(timestamp)) return "recently";

  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

export function TimeSince({ isoString }: { isoString: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const label = formatTimeSince(isoString);

  return <span className="text-gray-500">Updated {label}</span>;
}
