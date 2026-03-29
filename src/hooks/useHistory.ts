"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlayHistory } from "@/types";

export function useHistory(authenticated: boolean) {
  const [history, setHistory] = useState<PlayHistory[]>([]);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/history")
      .then((r) => {
        if (!r.ok) return { history: [] };
        return r.json();
      })
      .then((d) => setHistory(d.history))
      .catch(() => {});
  }, [authenticated]);

  const addEntry = useCallback(
    async (entry: {
      locationId: string;
      locationName: string;
      courtNumber?: string;
      date: string;
      time?: string;
      friends?: string[];
      notes?: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
        if (!res.ok) return false;
        const { id } = await res.json();
        setHistory((prev) => [
          {
            id,
            locationId: entry.locationId,
            locationName: entry.locationName,
            courtNumber: entry.courtNumber || null,
            date: entry.date,
            time: entry.time || null,
            friends: entry.friends || [],
            notes: entry.notes || "",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // ignore
    }
  }, []);

  return { history, addEntry, deleteEntry };
}
