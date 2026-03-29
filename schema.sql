-- SF Tennis Court Dashboard - D1 Schema

CREATE TABLE IF NOT EXISTS favourites (
  location_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS friends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  emoji TEXT NOT NULL DEFAULT '👤',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS play_history (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  court_number TEXT,
  date TEXT NOT NULL,
  time TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Many-to-many: which friends played in each session
CREATE TABLE IF NOT EXISTS play_history_friends (
  history_id TEXT NOT NULL REFERENCES play_history(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  PRIMARY KEY (history_id, friend_id)
);
