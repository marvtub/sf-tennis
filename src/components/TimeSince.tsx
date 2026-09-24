"use client";

import { useState, useEffect } from "react";

export function formatTimeSince(isoString: string, now = Date.now()) {
  const timestamp = Date.parse(isoString);
  if (!Number.isFinite(timestamp)) return "recently";

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function TimeSince({ isoString }: { isoString: string }) {
  const [label, setLabel] = useState("recently");

  useEffect(() => {
    const updateLabel = () => setLabel(formatTimeSince(isoString));

    updateLabel();
    const interval = setInterval(updateLabel, 10000);
    return () => clearInterval(interval);
  }, [isoString]);

  return <span className="text-gray-500">Updated {label}</span>;
}
