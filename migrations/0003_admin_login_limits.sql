-- Login links remember which visitor (keyed code, never the IP) asked for them,
-- so the hourly limit applies per visitor instead of to everyone at once.
ALTER TABLE admin_links ADD COLUMN who TEXT;
