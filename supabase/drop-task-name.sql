-- Remove name field from tasks table: description covers this already
ALTER TABLE tasks
  DROP COLUMN IF EXISTS name;
