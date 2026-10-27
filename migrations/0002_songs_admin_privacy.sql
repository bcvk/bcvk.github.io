-- October 2026: song suggestions, admin panel, keyed visitor codes.
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at INTEGER NOT NULL);

-- One row per visitor per day so the visitor map counts each person once. Deleted daily.
CREATE TABLE IF NOT EXISTS visit_seen (h TEXT PRIMARY KEY, day TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS visit_seen_day ON visit_seen (day);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  art TEXT,
  url TEXT NOT NULL,
  name TEXT,
  note TEXT,
  lang TEXT,
  country TEXT,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_at INTEGER,
  notified INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS songs_status ON songs (status, created_at);
CREATE INDEX IF NOT EXISTS songs_ip ON songs (ip_hash, created_at);
-- A song can only be waiting or on the playlist once.
CREATE UNIQUE INDEX IF NOT EXISTS songs_track_open ON songs (track_id) WHERE status IN ('pending', 'approved');

CREATE TABLE IF NOT EXISTS admin_links (h TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER);

ALTER TABLE messages ADD COLUMN read_at INTEGER;
-- Messages that arrived before the panel existed were already read by mail.
UPDATE messages SET read_at = created_at WHERE read_at IS NULL;

-- The old codes were unkeyed hashes; they are past their 24 hours anyway.
UPDATE messages SET ip_hash = NULL;
