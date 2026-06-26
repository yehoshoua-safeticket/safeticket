# Design System: SafeTicket

> **Source of truth.** This document is generated from the live implementation —
> `src/app/globals.css` (`:root` tokens) and `src/app/layout.tsx` (fonts). When code
> and doc disagree, **the CSS `:root` block wins**; update this file to match.
> Implementation must reference these tokens — no ad-hoc hex values.

SafeTicket is a second-hand ticket marketplace with full escrow protection
(storefront → checkout → buyer/seller dashboard → admin), bilingual **Hebrew + English**
with full RTL support. Stack: Next.js 16, React 19, Tailwind v4, Supabase, `lucide-react`.

---

## 1. Visual Theme & Atmosphere

**Clean, bright, trust-forward, image-led.** The canvas is **pure white**, not a warm
off-white and not a dark theme — chrome stays quiet so event photography and one decisive
blue carry the page. The mood is **crisp and confident**: deep logo-navy ink on white,
generous whitespace, tabular numerals for prices, and a single electric blue reserved for
every primary action. Event tiles are full-colour photos under a bottom-weighted scrim;
everything else is restrained.

Density is **medium-airy** — high-density data (dashboards, admin tables) coexists with
spacious marketing sections, but the palette never darkens. Red is rationed strictly to
urgency and destructive actions.

---

## 2. Color Palette & Roles

All values are CSS custom properties on `:root` in `globals.css`. Names below are
descriptive; the token is what code uses.

### Surfaces & ink
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Pure White | `#ffffff` | `--background` / `--surface` / `--card` | App canvas, cards, nav, sheets |
| Pale Periwinkle Wash | `#edf2ff` | `--surface-2` | Raised states — hover, inputs, chips |
| Soft Lavender Hairline | `#cdd6f0` | `--card-border` | Card / divider borders |
| Faint Lavender Hairline | `#dfe6f5` | `--card-border-soft` | Lighter dividers |
| Logo Navy (Ink) | `#0d1d45` | `--foreground` / `--ink` | Primary text |
| Slate Blue-Grey | `#4a5d82` | `--muted` | Secondary text, metadata, overlines (AA on white) |

### Accents
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Electric Logo Blue | `#1a55e3` | `--accent` | **The one loud accent** — primary buttons, links, active rail |
| Deeper Pressed Blue | `#1548cc` | `--accent-hover` / `--accent-text` | Hover/pressed fills; AA-safe blue text on white |
| Translucent Blue Tint | `rgba(26,85,227,0.08)` | `--accent-soft` | Tinted chips, active backgrounds, icon chips |
| Logo Navy (Accent-2) | `#0d1d45` | `--accent-2` / `--accent-2-text` | Secondary emphasis, dark-on-light accents |
| Translucent Navy Tint | `rgba(13,29,69,0.08)` | `--accent-2-soft` | Secondary tinted backgrounds |

### Status (semantic — tinted fill + colored text)
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Signal Red | `#d33b33` | `--danger` | Errors, destructive actions |
| Burnt Orange | `#e0531f` | `--urgency` | "Selling fast", low stock |
| Emerald Green | `#1e9e63` | `--success` | Verified seller, paid, active |
| Antique Gold | `#b8860b` | `--warning` | Pending states |

### Form & focus
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Frost Blue Field | `#f4f7ff` | `--input-bg` | Input / select / textarea fill |
| Periwinkle Field Border | `#c4d0ea` | `--input-border` | Field borders |
| Electric Blue Ring | `#1a55e3` | `--ring` | `:focus-visible` outline (2px, 2px offset) |

> **Note on dashboard chips:** `DashboardCard` mixes token-blue with Tailwind palette
> tints (`emerald-50`, `amber-50`, `red-50`, `violet-50`) for multi-series stat colours.
> These are the sanctioned exception to the token-only rule, scoped to data viz.

---

## 3. Typography Rules

Two Google fonts, both carrying **Latin + Hebrew** subsets (loaded via `next/font` in
`layout.tsx`):

- **Display / headings — Rubik** (`--font-display`, weights 500/600/700/800).
  Geometric and bold. `h1–h3` are weight **700** with tight **`-0.02em`** tracking.
  CTAs and labels are **UPPERCASE**.
- **Body / UI — Assistant** (`--font-sans`). Clean, legible Hebrew + Latin for all
  running text and controls.
- **Numerals — tabular.** `.font-mono-nums` applies `font-feature-settings:"tnum"` so
  prices and quantities align in columns.
- **Overline** (`.overline`): Assistant, UPPERCASE, `0.16em` tracking, `0.7rem`,
  weight 700 — section labels, card titles, metadata.

`::selection` is white text on Electric Blue. Scrollbars are thin, themed to the
periwinkle wash.

---

## 4. Component Stylings

States required throughout: **default / hover / focus-visible / active / disabled / loading.**

- **Buttons / primary:** Electric Blue (`--accent`) fill, white text, UPPERCASE Rubik 700,
  `--r-md` corners, ≥ 44px tall. Hover → `--accent-hover`; focus → 2px `--ring` at 2px
  offset; active → `translateY(1px) scale(.99)` (via `.site-anim`); disabled → reduced
  opacity; loading → spinner + label.
- **Buttons / secondary:** Transparent, `1px --card-border`, ink text; hover fills
  `--surface-2`.
- **Buttons / ghost & icon:** No border; hover `--surface-2`; icon buttons 40–44px square.
- **Cards / containers:** White (`--surface`), `1px --card-border`, `--r-md` (12px) corners,
  `.elev-1` shadow (`0 1px 2px / 0 4px 12px` soft black). Padding ~20px (`p-5`).
  Hover lift available via `.hover-stub` (translateY -2px + deeper shadow).
- **Inputs / select / textarea:** `--input-bg` fill, `1px --input-border`, `--r-md`, 44px
  tall; focus → border `--accent` + ring; error → `--danger` border + helper text.
  Number spinners are stripped.
- **Event tile:** Full-colour cover photo (`.cover-photo`, 16:9) under a bottom-weighted
  `.cover-scrim` gradient; category pill, title (Rubik), venue · city · date (muted),
  "from ₪X". `.tile-hover` → translateY(-3px) + scale photo 1.05 + border `--accent`.
  Category fallbacks: concert `#3a1d5c`, sports `#0d3b66`, theater `#4a1d4f`,
  festival `#5c1d3a`, other `#26262e`.
- **Badge / status (`StatusBadge`):** Pill (`rounded-full`), tinted fill + colored text,
  UPPERCASE, ~11px — mapped to success / warning / danger / accent.
- **Stat card (`DashboardCard`):** White surface, overline title (muted), value in Rubik
  3xl bold, accent icon chip (`--accent-soft` bg, 36px). Multi-series colour via the
  sanctioned Tailwind-tint map.
- **Carousel row:** Heading + "see all"; horizontal scroll-snap (`.carousel`), hidden
  scrollbar, edge-fade; reversed direction under RTL.
- **Filter bar / `FieldSearch`:** Sticky; field-aware search with active-filter chips and
  full keyboard nav (↑↓ / Enter / Backspace / Escape).
- **Skeleton (`.skeleton`):** Periwinkle-wash shimmer (`skeleton-shimmer`, 1.4s) for all
  async lists/detail — never a bare spinner page where a skeleton fits.
- **Empty state (`EmptyState`):** Icon, headline, supporting line, primary CTA.
- **Icons:** `lucide-react`, thin stroke (`strokeWidth ≈ 1.8`), ~18px in chips.

---

## 5. Layout Principles

- **Geometry:** radii `--r-sm 8px` · `--r-md 12px` · `--r-lg 16px`, plus **pill
  `9999px`** — and pills dominate in practice (`rounded-full` is the most-used radius:
  badges, chips, switches, avatars). Cards are subtly rounded; nothing is sharp-edged.
- **Elevation is whisper-soft.** `.elev-1` (`0 1px 2px` + `0 4px 12px` at 4–6% black) for
  resting cards; `.elev-2` (`0 12px 32px` at 12%) for modals/menus. No heavy drop shadows.
- **Containers:** content commonly capped at `max-w-2xl` (forms/reading) up through
  `max-w-5xl`–`max-w-7xl` (dashboards, storefront grids); immersive sections go full-bleed.
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Grid:** event tiles `repeat(auto-fill, minmax(260px, 1fr))`, gap 20–24.
- **Whitespace strategy:** generous around marketing/hero; tighter, scannable density in
  data views — the white canvas is held constant across both.

---

## 6. Motion

Scoped, purposeful, and **`prefers-reduced-motion`-aware** (every keyframe animation has a
reduce override). Available primitives in `globals.css`:

- **Tile/card hover:** `.tile-hover`, `.hover-stub` — subtle lift + scale.
- **Page-load:** `.stagger-children` (`count-up`, staggered ≤ 8 items); `FadeIn` component.
- **Marquee ticker:** `.marquee-track` (30s loop, RTL-reversed).
- **Hero:** `.hero-zoom` (slow Ken-Burns), `.hero-gradient-orb` (blurred floating orb),
  `.pulse-ring`.
- **Buttons:** `.site-anim` adds press (`translateY(1px) scale(.99)`) + hover brightness
  on the public site; `.no-anim` opts out (dashboard/admin).
- **Texture:** `.dot-grid` (subtle radial dots), `.noise-overlay` (4% SVG fractal noise).

---

## 7. Accessibility (WCAG 2.2 AA — non-negotiable)

- Visible `:focus-visible` ring (2px `--ring`, 2px offset) on **every** interactive element —
  enforced globally in `globals.css`.
- Contrast ≥ 4.5:1 text / ≥ 3:1 large & UI; tokens above are chosen to pass on white.
- Full keyboard operability, including `FieldSearch` (↑↓ / Enter / Esc / Backspace),
  carousels, and dialogs.
- Semantic landmarks (`header` / `nav` / `main` / `footer`), labelled controls, `alt` on
  event imagery, `aria-live` for async + errors.
- **RTL-correct:** logical properties (`start`/`end`), direction-aware icons and motion
  (`[dir="rtl"]` reverses marquee/carousel).
- Tap targets ≥ 44px.
