-- Prevent duplicate phone numbers across profiles (ignores NULL/empty)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON profiles(phone)
  WHERE phone IS NOT NULL AND phone <> '';
