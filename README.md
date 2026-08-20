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

Migrations live in `supabase/migrations/`, named by timestamp and applied with the
Supabase CLI:

```bash
supabase link --project-ref hcxdooiirngjodlckjsv
supabase db push
```

An existing database that already received these migrations by hand must first mark
them as applied — see `supabase/README.md`, which also covers seeding and the
one-off scripts in `supabase/scripts/`.

## Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── staff/              # Staff management tool (off the public site)
│   ├── auth/               # Login, Signup, Forgot Password
│   ├── checkout/           # Buyer checkout flow
│   ├── contact/            # Contact page
│   ├── account/            # Customer area — orders, listings, profile, settings
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

## Testing

```bash
npm test           # Vitest, watch mode
npm run test:run   # single run, what CI uses
npm run typecheck  # tsc --noEmit
npm run lint
```

Unit tests cover the pure helpers in `src/lib/` (`__tests__/`). Components and
routes are not unit-tested — see `.github/workflows/ci.yml`, where `next build`
is what actually exercises them.

## Deployment

Deployed on Netlify via `@netlify/plugin-nextjs` (see `netlify.toml`):

```bash
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
