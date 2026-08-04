-- Staff sign in with a username instead of an email, so a staff credential is
-- rejected outright by the public login form (which requires an email address).
-- Stored lowercased; the index leaves customer rows (NULL) alone.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Backfill existing staff from their email local-part, otherwise they'd be locked
-- out of /staff/login the moment this ships. Collisions get a numeric suffix.
WITH candidates AS (
  SELECT
    id,
    lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')) AS base,
    row_number() OVER (
      PARTITION BY lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g'))
      ORDER BY created_at
    ) AS rn
  FROM profiles
  WHERE role IN ('admin', 'internal_user')
    AND (username IS NULL OR username = '')
)
UPDATE profiles p
SET username = CASE WHEN c.rn = 1 THEN c.base ELSE c.base || c.rn::text END
FROM candidates c
WHERE p.id = c.id
  AND c.base <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (username)
  WHERE username IS NOT NULL AND username <> '';
