# SafeTicket

פלטפורמה מאובטחת לקנייה ומכירה של כרטיסים יד שנייה.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS** (v4)
- **Supabase** (Auth + Database)
- **Lucide React** (Icons)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor to create all tables.
Optionally run `supabase/seed.sql` for sample event data.

## Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── admin/              # Admin dashboard
│   ├── auth/               # Login, Signup, Forgot Password
│   ├── checkout/           # Buyer checkout flow
│   ├── contact/            # Contact page
│   ├── dashboard/          # User, Buyer, Seller dashboards
│   ├── faq/                # FAQ page
│   ├── how-it-works/       # How it works page
│   ├── sell/               # Sell ticket form
│   ├── support/            # Disputes & support
│   ├── tickets/            # Browse & ticket details
│   └── verify/             # Identity verification
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── tickets/            # TicketCard, FilterBar
│   └── ui/                 # StatusBadge, DashboardCard, etc.
├── data/                   # Mock data
├── lib/                    # Supabase client
└── types/                  # TypeScript types
```

## Features

- Hebrew RTL-first design
- Dark premium UI
- Buyer protection (escrow) messaging
- Anti-fraud UX (verification badges, risk flags)
- Price enforcement (asking price ≤ face value)
- Full user/seller/admin dashboards
- Mock payment flow with status tracking
- Dispute workflow
- Mobile-first responsive design

## Deployment

Ready for deployment on Vercel:

```bash
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
