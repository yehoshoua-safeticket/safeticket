-- Clear all demo/seed data from the database
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Clear in dependency order (children before parents)
DELETE FROM admin_notes;
DELETE FROM verifications;
DELETE FROM payouts;
DELETE FROM disputes;
DELETE FROM orders;
DELETE FROM listings;
DELETE FROM events;

-- Add missing INSERT RLS policy for profiles
-- (required so new users can create their own profile row on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
