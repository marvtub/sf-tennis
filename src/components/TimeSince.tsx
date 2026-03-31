"use client";

import { useState, useEffect } from "react";

export function TimeSince({ isoString }: { isoString: string }) {
  const [, setTick] = useState(0);

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
