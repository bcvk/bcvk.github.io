-- Schema as it existed before October 2026 (for reference; already applied).
CREATE TABLE IF NOT EXISTS visits (country TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, last_seen INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, reason TEXT, name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL, lang TEXT, country TEXT, ip_hash TEXT, notified INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS messages_ip_time ON messages (ip_hash, created_at);
