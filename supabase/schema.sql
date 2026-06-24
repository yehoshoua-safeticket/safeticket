-- SafeTicket Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'external_user' CHECK (role IN ('external_user', 'internal_user', 'admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('concert', 'sports', 'theater', 'festival', 'conference', 'other')),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_review', 'active', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  section TEXT,
  "row" TEXT,
  seat_info TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  face_value NUMERIC(10,2) NOT NULL CHECK (face_value > 0),
  asking_price NUMERIC(10,2) NOT NULL CHECK (asking_price > 0),
  currency TEXT NOT NULL DEFAULT 'ILS',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'active', 'sold', 'rejected', 'expired')),
  ticket_file_url TEXT,
  risk_status TEXT NOT NULL DEFAULT 'clear' CHECK (risk_status IN ('clear', 'flagged', 'under_review', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce: asking price must be <= face value
  CONSTRAINT price_check CHECK (asking_price <= face_value)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'held', 'released', 'refunded', 'failed')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'disputed')),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'held', 'pending_release', 'released', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'pending_release', 'released', 'cancelled')),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed')),
  admin_resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verifications table
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin notes table
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'listing', 'order', 'dispute')),
  target_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table (internal team task management)
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'canceled')),
  section     TEXT CHECK (section IN ('storefront', 'user_space', 'backoffice')),
  page        TEXT,
  device      TEXT CHECK (device IN ('not_relevant', 'mobile', 'tablet', 'computer')),
  active      BOOLEAN NOT NULL DEFAULT true,
  files       JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_event_id ON listings(event_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_listing_id ON orders(listing_id);
CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_verifications_user_id ON verifications(user_id);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper: avoids recursive policy evaluation when checking admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'internal_user')
  );
$$;

-- Public read access for events and active listings
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
-- Profiles: own row always readable; admins can read all (needed for task assignee/creator joins)
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Sellers can manage own listings" ON listings FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "Users can view own disputes" ON disputes FOR SELECT USING (opened_by = auth.uid());
CREATE POLICY "Users can view own payouts" ON payouts FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Users can view own verifications" ON verifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins have full access to tasks" ON tasks FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
