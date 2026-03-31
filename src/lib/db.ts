import type { Friend, FavouriteCourt, PlayHistory } from "@/types";

/**
 * Database abstraction.
 * In production (CF Workers): uses D1 via env binding.
 * In development: uses a simple JSON file for local testing.
 */

// D1 binding type
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

// In CF Workers, D1 is available via getCloudflareContext.
// Dynamic import avoids bundler issues; try/catch handles local dev.
function getDb(): D1Database | null {
  try {
    // @opennextjs/cloudflare provides context at runtime in Workers
    const mod = globalThis as unknown as {
      __openNextCloudflare?: { getCloudflareContext: () => { env: { DB: D1Database } } };
    };
    if (mod.__openNextCloudflare) {
      return mod.__openNextCloudflare.getCloudflareContext().env.DB;
    }
    // Fallback: require (works in current opennext versions)
    const { getCloudflareContext } = Function('return require("@opennextjs/cloudflare")')();
    return (getCloudflareContext().env as { DB: D1Database }).DB;
  } catch {
    return null;
  }
}

// ── Favourites ──

export async function getFavourites(): Promise<string[]> {
  const db = getDb();
  if (!db) return getLocalData<string[]>("favourites", []);

  const { results } = await db
    .prepare("SELECT location_id FROM favourites ORDER BY created_at DESC")
    .all<{ location_id: string }>();
  return results.map((r) => r.location_id);
}

export async function addFavourite(locationId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const favs = getLocalData<string[]>("favourites", []);
    if (!favs.includes(locationId)) favs.push(locationId);
    setLocalData("favourites", favs);
    return;
  }

  await db
    .prepare(
      "INSERT OR IGNORE INTO favourites (location_id) VALUES (?)"
    )
    .bind(locationId)
    .run();
}

export async function removeFavourite(locationId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const favs = getLocalData<string[]>("favourites", []);
    setLocalData("favourites", favs.filter((id) => id !== locationId));
    return;
  }

  await db
    .prepare("DELETE FROM favourites WHERE location_id = ?")
    .bind(locationId)
    .run();
}

// ── Friends ──

export async function getFriends(): Promise<Friend[]> {
  const db = getDb();
  if (!db) return getLocalData<Friend[]>("friends", []);

  const { results } = await db
    .prepare("SELECT * FROM friends ORDER BY name ASC")
    .all<{
      id: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      emoji: string;
      created_at: string;
    }>();
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    emoji: r.emoji,
    createdAt: r.created_at,
  }));
}

export async function addFriend(
  friend: Omit<Friend, "createdAt">
): Promise<void> {
  const db = getDb();
  if (!db) {
    const friends = getLocalData<Friend[]>("friends", []);
    friends.push({ ...friend, createdAt: new Date().toISOString() });
    setLocalData("friends", friends);
    return;
  }

  await db
    .prepare(
      "INSERT INTO friends (id, name, address, lat, lng, emoji) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(friend.id, friend.name, friend.address, friend.lat, friend.lng, friend.emoji)
    .run();
}

export async function removeFriend(id: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const friends = getLocalData<Friend[]>("friends", []);
    setLocalData("friends", friends.filter((f) => f.id !== id));
    return;
  }

  await db.prepare("DELETE FROM friends WHERE id = ?").bind(id).run();
}

// ── Play History ──

export async function getPlayHistory(): Promise<PlayHistory[]> {
  const db = getDb();
  if (!db) return getLocalData<PlayHistory[]>("playHistory", []);

  const { results } = await db
    .prepare(
      "SELECT * FROM play_history ORDER BY date DESC, time DESC"
    )
    .all<{
      id: string;
      location_id: string;
      location_name: string;
      court_number: string | null;
      date: string;
      time: string | null;
      notes: string;
      created_at: string;
    }>();

  // Fetch friend associations
  const entries: PlayHistory[] = [];
  for (const r of results) {
    const { results: friendRows } = await db
      .prepare(
        "SELECT friend_id FROM play_history_friends WHERE history_id = ?"
      )
      .bind(r.id)
      .all<{ friend_id: string }>();

    entries.push({
      id: r.id,
      locationId: r.location_id,
      locationName: r.location_name,
      courtNumber: r.court_number,
      date: r.date,
      time: r.time,
      friends: friendRows.map((f) => f.friend_id),
      notes: r.notes,
      createdAt: r.created_at,
    });
  }
  return entries;
}

export async function addPlayHistory(
  entry: Omit<PlayHistory, "createdAt">
): Promise<void> {
  const db = getDb();
  if (!db) {
    const history = getLocalData<PlayHistory[]>("playHistory", []);
    history.unshift({ ...entry, createdAt: new Date().toISOString() });
    setLocalData("playHistory", history);
    return;
  }

  await db
    .prepare(
      "INSERT INTO play_history (id, location_id, location_name, court_number, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      entry.id,
      entry.locationId,
      entry.locationName,
      entry.courtNumber,
      entry.date,
      entry.time,
      entry.notes
    )
    .run();

  // Insert friend associations
  for (const friendId of entry.friends) {
    await db
      .prepare(
        "INSERT INTO play_history_friends (history_id, friend_id) VALUES (?, ?)"
      )
      .bind(entry.id, friendId)
      .run();
  }
}

export async function updatePlayHistory(
  id: string,
  fields: Partial<Omit<PlayHistory, "id" | "createdAt">>
): Promise<boolean> {
  const db = getDb();
  if (!db) {
    const history = getLocalData<PlayHistory[]>("playHistory", []);
    const idx = history.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    Object.assign(history[idx], fields);
    setLocalData("playHistory", history);
    return true;
  }

  // Build dynamic SET clause from provided fields
  const columnMap: Record<string, string> = {
    locationId: "location_id",
    locationName: "location_name",
    courtNumber: "court_number",
    date: "date",
    time: "time",
    notes: "notes",
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(columnMap)) {
    if (key in fields) {
      sets.push(`${col} = ?`);
      values.push((fields as Record<string, unknown>)[key] ?? null);
    }
  }

  if (sets.length > 0) {
    values.push(id);
    await db
      .prepare(`UPDATE play_history SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // Update friends if provided
  if (fields.friends) {
    await db
      .prepare("DELETE FROM play_history_friends WHERE history_id = ?")
      .bind(id)
      .run();
    for (const friendId of fields.friends) {
      await db
        .prepare(
          "INSERT INTO play_history_friends (history_id, friend_id) VALUES (?, ?)"
        )
        .bind(id, friendId)
        .run();
    }
  }

  return true;
}

export async function deletePlayHistory(id: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const history = getLocalData<PlayHistory[]>("playHistory", []);
    setLocalData("playHistory", history.filter((h) => h.id !== id));
    return;
  }

  await db.prepare("DELETE FROM play_history WHERE id = ?").bind(id).run();
}

// ── Local dev fallback (JSON in memory) ──

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), ".data.json");

function getLocalStore(): Record<string, unknown> {
  if (!existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function getLocalData<T>(key: string, defaultValue: T): T {
  const store = getLocalStore();
  return (store[key] as T) ?? defaultValue;
}

function setLocalData(key: string, value: unknown): void {
  const store = getLocalStore();
  store[key] = value;
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}
