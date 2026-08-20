-- Create admin user (run this in Supabase SQL Editor)
-- Replace the email and password with your test credentials

-- Step 1: Insert admin profile (execute in Supabase SQL Editor)
-- Note: The user ID will be created by Supabase Auth
-- Use a UUID from your auth.users table

INSERT INTO profiles (id, full_name, email, phone, role, verification_status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Admin User',
  'admin@safeticket.local',
  null,
  'admin',
  'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Step 2: Create the auth user via Supabase Auth (requires using API or CLI)
-- For development, you can:
-- 1. Sign up normally at /auth/signup with any email
-- 2. Get the user ID from Supabase Dashboard -> Auth Users
-- 3. Update their profile role to 'admin' with this query:

-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
