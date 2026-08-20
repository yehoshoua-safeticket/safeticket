-- Add device field to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS device TEXT
    CHECK (device IN ('not_relevant', 'mobile', 'tablet', 'computer'));
