-- Add done_at field to tasks table: timestamp of when the task was marked done
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ;
