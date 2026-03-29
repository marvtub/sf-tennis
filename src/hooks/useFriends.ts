"use client";

import { useState, useEffect, useCallback } from "react";
import type { Friend } from "@/types";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends))
      .catch(() => {});
  }, []);

  const addFriend = useCallback(
    async (friend: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      emoji?: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(friend),
        });
        if (!res.ok) return false;
        const { id } = await res.json();
        setFriends((prev) => [
          ...prev,
          {
            id,
            ...friend,
            emoji: friend.emoji || "👤",
            createdAt: new Date().toISOString(),
          },
        ]);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const removeFriend = useCallback(async (id: string) => {
    try {
      await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // ignore
    }
  }, []);

  return { friends, addFriend, removeFriend };
}
