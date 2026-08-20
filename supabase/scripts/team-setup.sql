-- Team setup / cleanup
-- Run in Supabase SQL Editor AFTER creating accounts via the admin team page
-- (or Supabase Auth dashboard).

-- ── Clean up: remove all existing profiles ───────────────────────────────────
-- auth.users rows are deleted via Supabase Auth Admin API (team page → delete button).
-- This removes any orphaned profile rows not cleaned by cascade:
DELETE FROM profiles WHERE true;

-- ── Seed: promote users to admin after their auth accounts exist ──────────────
-- Replace the UUIDs below with the actual auth.users UUIDs for each person.
-- You can find UUIDs in Supabase → Authentication → Users.

-- INSERT INTO profiles (id, email, full_name, role, verification_status)
-- VALUES
--   ('<yehoshua-uuid>',  'yehoshua@email.com',  'יהושע',        'admin', 'verified'),
--   ('<elad-uuid>',      'elad@email.com',      'אלעד אסולין',  'admin', 'verified'),
--   ('<yehiel-uuid>',    'yehiel@email.com',    'יחיאל זמור',   'admin', 'verified'),
--   ('<saba-uuid>',      'saba@email.com',       'סבה',          'admin', 'verified')
-- ON CONFLICT (id) DO UPDATE
--   SET role = 'admin', verification_status = 'verified';
