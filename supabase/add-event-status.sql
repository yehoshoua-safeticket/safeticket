-- Event validation workflow: events now require admin approval.
-- Run this in the Supabase SQL editor.
--
-- Existing events default to 'active' (stay live). Seller-created events are
-- inserted as 'pending_review' by /api/events and must be approved by an admin
-- before their tickets can go live.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending_review', 'active', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
