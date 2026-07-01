# Design System: Ticketmaster look-and-feel

> **Goal.** Make every surface of this project read like the **Ticketmaster**
> platform — Ticketmaster's *Aurora* design language: **Azure** blue on a crisp
> white canvas, **Black Pearl** dark chrome (header/footer/hero), **Averta**
> typography, image-forward event discovery, and the signature Azure→violet→teal
> "live event" gradient reserved for heroes.
>
> **How to use.** This file is the **target spec**. The `:root` token block in
> §2.6 is drop-in ready for `src/app/globals.css` — apply it and all existing
> components (which already reference `--accent`, `--background`, etc.) retarget to
> Ticketmaster automatically. When code and doc disagree, update code to match
> this doc, then keep them in sync. Implementation must reference tokens — no
> ad-hoc hex.
>
> Stack: Next.js 16, React 19, Tailwind v4, Supabase, `lucide-react`.
> Brand source: Ticketmaster *Aurora* design system (design.ticketmaster.com).

---

## 1. Visual Theme & Atmosphere

**Bright, image-led, high-energy, trust-forward.** The discovery canvas is **pure
white** so event photography and one decisive **Azure** blue carry the page —
exactly how ticketmaster.com presents concerts, sports and theater. Chrome frames
the experience in **Black Pearl** (near-black ink-navy): the top nav, the footer,
and full-bleed hero bands are dark, while listings, cards and forms sit on white.

The mood is **electric but orderly**. Azure is the single loud action colour;
**Aquamarine** teal is the sparing "excitement" accent (badges, live indicators,
gradient tails). Heroes use the *Aurora* gradient — bright blue melting into rich
violet and vibrant teal, inspired by the northern lights. Everything else is
restrained: generous whitespace, tabular price numerals, and photography doing the
emotional work.

Density is **medium-airy**: spacious marketing/hero sections coexist with dense
dashboards and admin tables, but the palette never muddies. Red is rationed to
urgency ("selling fast") and destructive actions only.

---

## 2. Color Palette & Roles

All values live as CSS custom properties on `:root` in `globals.css`. Descriptive
names below are for humans; **code uses the token**.

### 2.1 Brand primaries (Ticketmaster confirmed)
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| **Ticketmaster Azure** | `#026CDF` | `--accent` | THE brand blue — primary buttons, links, active states, focus ring |
| **Black Pearl** | `#1F262D` | `--ink` / `--foreground` | Primary text; dark chrome (nav, footer, hero) surface |
| **White** | `#ffffff` | `--background` / `--surface` / `--card` | App canvas, cards, sheets, listing background |
| **Azure (light) — on-dark text** | `#4191E7` | `--accent-on-dark` | Azure links/labels sitting on Black Pearl |

### 2.2 Secondary accent (Aurora "excitement")
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| **Aquamarine** | `#00E0C7` | `--accent-2` | Live/"on sale" indicators, secondary highlights, gradient tail *(approx — TM's exact aqua)* |
| Aquamarine tint | `rgba(0,224,199,0.12)` | `--accent-2-soft` | Aqua chips / tinted backgrounds |
| Aurora violet | `#7B2FF7` | `--aurora-violet` | Middle stop of the hero gradient only |

**Aurora hero gradient** (heroes / feature bands only):
`linear-gradient(120deg, #026CDF 0%, #7B2FF7 55%, #00E0C7 100%)`.

### 2.3 Azure support tints
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Pressed Azure | `#0257B4` | `--accent-hover` | Hover / pressed button fill |
| Azure text-safe | `#0257B4` | `--accent-text` | Azure text on white (AA-safe) |
| Azure tint | `rgba(2,108,223,0.08)` | `--accent-soft` | Active backgrounds, icon chips, selected chips |

### 2.4 Surfaces, ink & lines
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Pale Azure Wash | `#eef3fc` | `--surface-2` | Raised/hover states, input fills, chips |
| Cool Hairline | `#d5dde8` | `--card-border` | Card / divider borders |
| Faint Hairline | `#e6ebf2` | `--card-border-soft` | Lighter dividers |
| Black Pearl (ink) | `#1F262D` | `--foreground` / `--ink` | Primary text |
| Slate Grey | `#5a6672` | `--muted` | Secondary text, metadata, overlines (AA on white) |

### 2.5 Semantic status (tinted fill + coloured text)
| Descriptive name | Hex | Token | Role |
|---|---|---|---|
| Signal Red | `#e0102b` | `--danger` | Errors, destructive actions |
| Burnt Orange | `#e0531f` | `--urgency` | "Selling fast", low stock |
| Emerald | `#1e9e63` | `--success` | Verified seller, paid, active |
| Amber | `#b8860b` | `--warning` | Pending states |

### 2.6 Drop-in `:root` block

Paste into `src/app/globals.css` (replaces the current `:root` token block):

```css
:root {
  /* Ticketmaster Aurora palette
     Azure #026CDF · Black Pearl #1F262D · Aquamarine #00E0C7 · White */
  --background: #ffffff;
  --surface: #ffffff;
  --surface-2: #eef3fc;
  --card: #ffffff;
  --card-border: #d5dde8;
  --card-border-soft: #e6ebf2;
  --ink: #1F262D;
  --foreground: #1F262D;         /* Black Pearl */
  --muted: #5a6672;

  --accent: #026CDF;             /* Ticketmaster Azure */
  --accent-hover: #0257B4;
  --accent-text: #0257B4;        /* AA-safe azure text on white */
  --accent-soft: rgba(2, 108, 223, 0.08);
  --accent-on-dark: #4191E7;     /* azure text on Black Pearl */

  --accent-2: #00E0C7;           /* Aquamarine */
  --accent-2-soft: rgba(0, 224, 199, 0.12);
  --aurora-violet: #7B2FF7;

  --danger: #e0102b;
  --urgency: #e0531f;
  --success: #1e9e63;
  --warning: #b8860b;

  --input-bg: #f5f8fd;
  --input-border: #cbd6e6;
  --ring: #026CDF;

  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
}
```

> **Dashboard-chip exception.** `DashboardCard` may mix token-Azure with Tailwind
> palette tints (`emerald-50`, `amber-50`, `red-50`, `violet-50`) for multi-series
> stats — the sanctioned exception to the token-only rule, scoped to data viz.

---

## 3. Typography Rules

Ticketmaster's brand typeface is **Averta** (weights 300–800; Calibri/Helvetica
Neue/Arial as fallbacks). If an Averta licence isn't available, substitute a close
geometric-humanist sans — **Mona Sans**, **Hanken Grotesk**, or **Figtree** — for
the display face; keep the current Hebrew-capable body face for RTL support.

- **Display / headings — Averta (or geometric-humanist fallback)** (`--font-display`,
  weights 600/700/800). Confident and geometric. `h1–h3` are weight **700–800** with
  tight **`-0.02em`** tracking. Marketing headlines can run large and punchy.
- **Body / UI — Averta / Assistant** (`--font-sans`). Averta for Latin; retain
  **Assistant** for Hebrew so RTL text stays native. All running text and controls.
- **CTAs & labels — UPPERCASE**, weight 700, letter-spaced — the Ticketmaster
  button voice ("FIND TICKETS", "SELL").
- **Numerals — tabular.** `.font-mono-nums` (`font-feature-settings:"tnum"`) so
  prices and quantities align in columns.
- **Overline** (`.overline`): UPPERCASE, `0.16em` tracking, `0.7rem`, weight 700 —
  section labels, card categories, metadata.

`::selection` is white text on Azure. Scrollbars are thin, themed to the Azure wash.

---

## 4. Component Stylings

Every interactive component ships all states: **default / hover / focus-visible /
active / disabled / loading.**

- **Button / primary ("Find Tickets"):** Azure (`--accent`) fill, white UPPERCASE
  label, `--r-md` corners (Ticketmaster CTAs are moderately rounded — 8–12px, not
  full pills), ≥ 44px tall. Hover → `--accent-hover`; focus → 2px `--ring` @ 2px
  offset; active → `translateY(1px) scale(.99)` via `.site-anim`; disabled →
  reduced opacity; loading → spinner + label.
- **Button / secondary:** White fill, `1px --card-border`, Black Pearl text; hover
  fills `--surface-2`, border → `--accent`. (On dark bands: transparent with
  `1px` white/azure border, white text.)
- **Button / ghost & icon:** No border; hover `--surface-2`; icon buttons 40–44px
  square.
- **Cards / containers:** White (`--surface`), `1px --card-border`, `--r-md` (12px)
  corners, `.elev-1` soft shadow. Padding ~20px (`p-5`). Optional hover lift via
  `.hover-stub` (translateY -2px + deeper shadow).
- **Event / discovery tile (the hero pattern):** Full-colour cover photo
  (`.cover-photo`, 16:9) under a bottom-weighted `.cover-scrim`; category pill
  (Azure-soft or Aquamarine for "live"), title (display face), `venue · city · date`
  (muted), `from ₪X`. `.tile-hover` → translateY(-3px) + photo scale 1.05 + border
  `--accent`. Category fallbacks: concert `#3a1d5c`, sports `#0d3b66`, theater
  `#4a1d4f`, festival `#5c1d3a`, other `#26262e`.
- **Badge / status (`StatusBadge`):** Pill (`rounded-full`), tinted fill + coloured
  text, UPPERCASE, ~11px — success / warning / danger / accent. "On sale now" /
  "Live" uses Aquamarine.
- **Stat card (`DashboardCard`):** White surface, muted overline title, value in
  display face 3xl bold, Azure icon chip (`--accent-soft` bg, 36px).
- **Carousel row (Ticketmaster's "Just Announced" rails):** Heading + "See All";
  horizontal scroll-snap (`.carousel`), hidden scrollbar, edge-fade; RTL-reversed.
- **Search / filter bar (`FieldSearch`, `SearchStrip`):** Ticketmaster's search is
  central to discovery — prominent, sticky, field-aware with active-filter chips and
  full keyboard nav (↑↓ / Enter / Backspace / Escape).
- **Top nav (Black Pearl):** Dark `--ink` bar, white logo + links, Azure primary
  CTA, white search affordance. Sticky.
- **Footer (Black Pearl):** Dark band, muted-white link columns, Azure links.
- **Skeleton (`.skeleton`):** Azure-wash shimmer for async lists/detail — never a
  bare spinner page where a skeleton fits.
- **Empty state (`EmptyState`):** Icon, headline, supporting line, primary CTA.
- **Icons:** `lucide-react`, thin stroke (`strokeWidth ≈ 1.8`), ~18px in chips.

---

## 5. Layout Principles

- **Geometry:** radii `--r-sm 8px` · `--r-md 12px` · `--r-lg 16px`, plus pill
  `9999px` for badges/chips/avatars. CTAs use `--r-md` (Ticketmaster buttons are
  softly rounded rectangles, not full pills). Nothing is sharp-edged.
- **Elevation is whisper-soft.** `.elev-1` (`0 1px 2px` + `0 4px 12px` at 4–6%
  black) for resting cards; `.elev-2` (`0 12px 32px` at 12%) for modals/menus.
- **Dark chrome / light content sandwich:** Black Pearl nav on top → white
  discovery/content body → Black Pearl footer. Hero bands may be Black Pearl or the
  Aurora gradient, full-bleed.
- **Containers:** forms/reading `max-w-2xl`; dashboards & storefront grids
  `max-w-5xl`–`max-w-7xl`; heroes and rails go full-bleed.
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Grid:** event tiles `repeat(auto-fill, minmax(260px, 1fr))`, gap 20–24.
- **Whitespace:** generous around hero/marketing; tighter, scannable density in data
  views. The white canvas is held constant across both.

---

## 6. Motion

Scoped, purposeful, `prefers-reduced-motion`-aware (every keyframe has a reduce
override). Primitives in `globals.css`:

- **Tile/card hover:** `.tile-hover`, `.hover-stub` — subtle lift + photo scale.
- **Page-load:** `.stagger-children` (`count-up`, ≤ 8 items); `FadeIn` component.
- **Rails ticker:** `.marquee-track` (30s loop, RTL-reversed) for "Just Announced".
- **Hero:** `.hero-zoom` (slow Ken-Burns), `.hero-gradient-orb` (blurred Aurora orb —
  retint to Azure/violet/aqua), `.pulse-ring` (Aquamarine "live" pulse).
- **Buttons:** `.site-anim` press (`translateY(1px) scale(.99)`) + hover brightness on
  the public site; `.no-anim` opts out (dashboard/admin).
- **Texture:** `.dot-grid`, `.noise-overlay` (4% SVG fractal noise) on dark bands.

---

## 7. Accessibility (WCAG 2.2 AA — non-negotiable)

- Visible `:focus-visible` ring (2px `--ring` Azure, 2px offset) on **every**
  interactive element — enforced globally in `globals.css`.
- Contrast ≥ 4.5:1 text / ≥ 3:1 large & UI. On Black Pearl use `--accent-on-dark`
  (`#4191E7`) for azure text and white for body; `#026CDF` azure text is reserved
  for white backgrounds only.
- Full keyboard operability — `FieldSearch` (↑↓ / Enter / Esc / Backspace),
  carousels, dialogs.
- Semantic landmarks (`header` / `nav` / `main` / `footer`), labelled controls,
  `alt` on event imagery, `aria-live` for async + errors.
- **RTL-correct:** logical properties (`start`/`end`), direction-aware icons and
  motion (`[dir="rtl"]` reverses marquee/carousel).
- Tap targets ≥ 44px.

---

## 8. Ticketmaster fidelity checklist

Ship-ready when all are true:

- [ ] Primary blue is **Azure `#026CDF`** everywhere (buttons, links, focus ring).
- [ ] Top nav and footer are **Black Pearl `#1F262D`** with white/azure content.
- [ ] Discovery/listing body is **white**, image-forward, with the event-tile pattern.
- [ ] Hero uses the **Aurora gradient** or Black Pearl, full-bleed.
- [ ] Headings render in **Averta** (or approved geometric fallback), 700–800, tight tracking.
- [ ] CTAs are **UPPERCASE**, `--r-md` rounded rectangles, ≥ 44px.
- [ ] **Aquamarine** appears only as a sparing "live / on-sale" accent.
- [ ] Prices use **tabular numerals**.
- [ ] Every interactive element shows the Azure **focus ring**.
- [ ] Hebrew/RTL still renders correctly with the native body face.

---

## 9. Homepage & Hero anatomy (build it like Ticketmaster)

### 9.1 Ticketmaster's homepage, top to bottom
1. **Dark top nav (Black Pearl).** Logo · primary categories (**Concerts, Sports,
   Arts · Theater & Comedy, Family**) · **Cities** · **More**. Right side: **search**,
   **Sign In / My Account**, **Sell**, **Gift Cards**, **Help**, cart.
2. **Global search** — a wide, prominent "Search by Artist, Event or Venue" field. On
   Ticketmaster search *is* the front door; it sits at or just under the hero.
3. **HERO = full-bleed rotating "Highlights" carousel.** Large edge-to-edge
   promotional banner **images** of featured tours/events, one slide at a time,
   **auto-rotating** (~5–7s) with **arrows + dot indicators**. Each slide is designed
   artwork (artist/event imagery) carrying the event name and a **"Find Tickets"**
   button. **The whole slide is a link** to that event's page. This is the single
   biggest difference from the current build — TM's hero is the featured carousel
   itself, at the very top, not a text headline.
4. **Category quick-links** — chips/tiles for Concerts, Sports, Arts & Theater, Family.
5. **"Popular Near You"** — tabbed by category; responsive **grid of event cards**
   (image · name · date · venue · city), each linking to the event.
6. **Editorial rails** — "Just Announced", Entertainment Guides, Discover More.
7. **Popular Cities** — text link grid (NYC, LA, Vegas, Chicago, …).
8. **Dark footer (Black Pearl).** Helpful Links / My Account / Our Network columns,
   social icons, app-store badges, legal row.

### 9.2 The hero pattern in detail
| Property | Ticketmaster behaviour | Build note (this repo) |
|---|---|---|
| Shape | Full-bleed, edge-to-edge; ~`h-[46vh]`→`70vh` desktop, shorter on mobile | Make the hero the `featured` carousel, moved **above** everything |
| Slides | Featured events, ≤ ~6, image-backed only | Reuse the `featured_events` query already in `page.tsx` (it already filters `!!image_url`) |
| Motion | Auto-advance ~5–7s, pause on hover/focus; arrows + dots | You already have `scrollCarousel` + a 3.5s interval — slow it, add dot indicators, show **1 slide** not 4 |
| Overlay | Bottom-weighted scrim; category pill (Azure/Aqua), title (display face), date · venue · city, **"Find Tickets" CTA** | Reuse `.cover-scrim`; add an Azure `--r-md` CTA button reading `FIND TICKETS` |
| Link | Entire slide → event page | `<Link href={`/tickets/${ev.id}`}>` wrapping the slide |
| A11y | `aria-roledescription="carousel"`, per-slide `aria-label`, arrows labelled, dots are buttons, respects reduced-motion | Pause interval when `prefers-reduced-motion` |

### 9.3 Link / route map (match Ticketmaster's IA to existing routes)
| Ticketmaster link | Purpose | This project's route |
|---|---|---|
| Concerts / Sports / Arts / Family | Category browse | `/tickets?category=concert` · `sports` · `theater` · `festival` (already used by category tiles) |
| Search (Artist/Event/Venue) | Global discovery | `/tickets` + `FieldSearch` / `SearchStrip` |
| An event / hero slide | Event detail → buy | `/tickets/[id]` |
| Buy / "Find Tickets" | Purchase flow | `/tickets/[id]` → `/checkout` |
| Sell | List a ticket | `/sell` |
| Sign In / My Account | Auth / account | `/auth/login` · `/dashboard` |
| Help | Support | `/support` · `/faq` · `/how-it-works` |
| Footer legal | Policies | `/terms` · `/privacy` · `/cookies` |

Ticketmaster's dominant CTA verb is **"Find Tickets"** (event lists) → **"Buy"** /
**"Get Tickets"** (event page). Mirror that language on hero slides, tiles, and the
event detail primary button.

### 9.4 Concrete refactor of the current `page.tsx`
The pieces already exist — they're just arranged as *text-hero-then-small-cards*.
To read as Ticketmaster:
1. **Promote `featured` to the hero.** Render it first, full-bleed, **one slide
   visible** (`VISIBLE = 1`), big (`h-[46vh]`+), with the overlay + `FIND TICKETS`
   button. Keep the existing RTL-aware arrow logic; add **dot indicators**.
2. **Demote / drop the text headline hero** (`t.home.heroLine1`) or fold the
   headline+subtitle into a slim strip under the hero next to the **global search**.
3. **Keep category tiles** as §9.1-4 quick-links directly under the hero.
4. **Add a "Popular Near You" rail** (reuse the tile pattern from §4) as a
   `repeat(auto-fill, minmax(260px,1fr))` grid or a scroll-snap carousel.
5. **Nav + footer → Black Pearl** (§4) so the dark-chrome / white-content sandwich
   matches. Retarget the hardcoded `#1a55e3` values in `page.tsx` to `--accent`
   (Azure) once the §2.6 tokens land.

> **Note:** the current hero text and buttons hardcode `#1a55e3` (old logo blue).
> After applying the §2.6 tokens, swap these to `var(--accent)` / `#026CDF` so the
> hero turns true Ticketmaster Azure.

---

### Sources
- [Ticketmaster Design — Brand Color](https://design.ticketmaster.com/brand/color/)
- [Ticketmaster Design — Colors Usage](https://design.ticketmaster.com/components/colors-usage/)
- [Ticketmaster Design — Typography](https://design.ticketmaster.com/components/typography/)
- [Backstage Design System by Ticketmaster (Figma Community)](https://www.figma.com/community/file/1436444629986647850/backstage-design-system-by-ticketmaster)
