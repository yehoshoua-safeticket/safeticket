-- Homepage curation: featured events (ordered) + one cover event per category.
-- Run this in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS / idempotent).
--
-- Both tables are publicly readable (the homepage reads them with the anon key)
-- but have NO write policy, so all inserts/updates/deletes go through the
-- service-role API routes (/api/admin/featured, /api/admin/category-covers),
-- matching how the events table is already handled.

-- ── Featured events for the homepage (up to 5, ordered by `position`) ──
CREATE TABLE IF NOT EXISTS featured_events (
  event_id   UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Featured are viewable by everyone" ON featured_events;
CREATE POLICY "Featured are viewable by everyone" ON featured_events
  FOR SELECT USING (true);

-- ── One cover event per category (category is the primary key) ──
CREATE TABLE IF NOT EXISTS category_covers (
  category   TEXT PRIMARY KEY
             CHECK (category IN ('concert','sports','theater','festival','conference','other')),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE category_covers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Category covers are viewable by everyone" ON category_covers;
CREATE POLICY "Category covers are viewable by everyone" ON category_covers
  FOR SELECT USING (true);
