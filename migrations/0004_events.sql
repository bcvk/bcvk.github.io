-- November 2026: anonymous daily tally of sections seen and buttons pressed.
-- One number per day, name and language. No visitor code, address or cookie is stored.
CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL, name TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'en', count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, name, lang));
