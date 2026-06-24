# SafeTicket — Design System Spec (Ticketmaster-benchmarked, dark)

> **Decision (2026-06):** Full Ticketmaster-style visual language on a warm **"blanc cassé" (off-white) light canvas**, applied across the **entire app** (storefront → checkout → dashboard → admin), delivered in phases. Supersedes the prior "risograph gig-poster" identity. (Initially shipped dark; flipped to the off-white light theme — `src/app/globals.css` `:root` is the live source of truth for token values.)

This is the single source of truth. Implementation must reference these tokens — no ad-hoc colors.

---

## 1. Design principles
1. **Dark, image-forward, high-density.** Event photography is the hero; chrome recedes. Near-black canvas, content in elevated surfaces.
2. **One loud accent.** Electric blue drives every primary action. Red is reserved for urgency/destructive only.
3. **Bold geometric type.** Heavy grotesk headlines, uppercase CTAs, tight tracking.
4. **Scannable funnels.** Search and filters are first-class; the buyer reaches a listing in ≤ 2 actions.
5. **Accessible by default.** WCAG 2.2 AA, visible focus, ≥ 4.5:1 contrast, ≥ 44px tap targets.

---

## 2. Color tokens (blanc cassé / light)

| Token | Value | Use |
|---|---|---|
| `--background` | `#F2EFE6` | App canvas (blanc cassé) |
| `--surface` | `#FBF9F3` | Cards, nav, sheets (lifted) |
| `--surface-2` | `#EBE6D9` | Raised (hover, inputs, chips) |
| `--card` | `#FBF9F3` | alias of surface (back-compat) |
| `--card-border` | `#DCD5C5` | Warm taupe hairline |
| `--foreground` | `#1A1714` | Ink text |
| `--muted` | `#6E6557` | Secondary text (AA on canvas) |
| `--accent` | `#2C6BF2` | TM blue — primary actions, links |
| `--accent-hover` | `#1F59D8` | Hover/pressed blue |
| `--accent-text` | `#1E50C9` | Blue text on light (AA) |
| `--accent-soft` | `rgba(44,107,242,0.10)` | Tinted chips/active states |
| `--danger` | `#D33B33` | Errors, destructive |
| `--urgency` | `#E0531F` | "Selling fast", low stock |
| `--success` | `#1E9E63` | Verified, paid, active |
| `--warning` | `#B8860B` | Pending |
| `--input-bg` | `#FCFAF4` | Form fields |
| `--input-border` | `#D6CFBF` | Field borders |
| `--ring` | `#2C6BF2` | Focus ring |

Status semantics (badges) map to success/warning/danger/accent above, rendered as tinted-fill + colored text on dark.

---

## 3. Typography
- **Display / headings:** **Rubik** (700/800) — geometric, bold, full Hebrew + Latin. Tight tracking (`-0.02em`); CTAs and labels **UPPERCASE**.
- **Body / UI:** **Assistant** (400/500/600) — clean Hebrew + Latin.
- **Numerals:** tabular (`font-feature-settings:"tnum"`) for prices/quantities.
- Scale (rem): `0.72 · 0.8 · 0.875 · 1 · 1.125 · 1.375 · 1.875 · 2.75 · 4` (mobile caps display at ~`2.75`).
- `.overline`: Assistant, uppercase, `0.16em` tracking, `0.7rem`, weight 700 — section labels & metadata.

---

## 4. Spacing, grid, radius, elevation
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Containers:** content `max-w-6xl`; immersive sections full-bleed.
- **Grid:** event tiles `repeat(auto-fill, minmax(260px, 1fr))`; gap 20–24.
- **Carousels:** horizontal scroll-snap rows ("Just Announced", "By city", "By category") on home + category pages.
- **Radius:** `--r-sm 8px`, `--r-md 12px`, `--r-lg 16px`, pill `9999px`.
- **Elevation:** `--e1 0 1px 0 rgba(255,255,255,.04) inset, 0 2px 8px rgba(0,0,0,.5)`; `--e2 0 8px 28px rgba(0,0,0,.6)` (modals/menus).

---

## 5. Component library (states required: default / hover / focus-visible / active / disabled / loading)

| Component | Spec |
|---|---|
| **Button / primary** | Blue fill `--accent`, white text, uppercase Rubik 700, radius-md, ≥44px tall. Hover `--accent-hover`; focus 2px `--ring` offset; active translateY(1px); disabled 45% opacity; loading → spinner + label. |
| **Button / secondary** | Transparent, `1px --card-border`, white text; hover `--surface-2`. |
| **Button / ghost & icon** | No border; hover `--surface-2`; icon buttons 40–44px square. |
| **Input / select / textarea** | `--input-bg`, `1px --input-border`, radius-md, 44px; focus border `--accent` + ring; error border `--danger` + helper text. |
| **Event tile** | Full-color photo (16:9), bottom dark scrim, category pill (blue), title (Rubik), venue·city·date (muted), price "from ₪X", hover: scale 1.02 + border `--accent`. |
| **Carousel row** | Heading + "see all" link; scroll-snap; edge-fade; arrow controls (desktop). |
| **Filter bar** | Sticky; search + city + category + date + price; chips for active filters; keyboard nav (existing `FieldSearch`). |
| **Badge / status** | Tinted fill + colored text, radius-sm, uppercase, 11px. |
| **Stat card** | Surface, label overline (muted), value Rubik 2xl, accent icon chip. |
| **Skeleton** | `--surface-2` shimmer; used for all async lists/detail. |
| **Toast / inline error** | `--danger` left-border surface card; success uses `--success`. |
| **Nav (top)** | Dark sticky; logo, primary search, location, login/account, blue "Sell" CTA. |
| **Sidebar (account/admin)** | Dark rail; active item = blue left-border + `--accent-soft`. |
| **Empty state** | Icon, headline, supporting line, primary CTA. |

---

## 6. Interaction & feedback
- **Loading:** skeletons for lists/detail; button spinners for mutations; never a bare spinner page where a skeleton fits.
- **Errors:** inline field errors; page-level error card with retry; never silent.
- **Urgency cues:** "Selling fast" (`--urgency`) when an event has ≤ N active listings; "Verified seller" (`--success`).
- **Motion:** tile hover scale, page-load stagger, carousel snap. Respect `prefers-reduced-motion`.

---

## 7. Accessibility (WCAG 2.2 AA — non-negotiable)
- Visible `:focus-visible` ring on every interactive element.
- Contrast ≥ 4.5:1 text / ≥ 3:1 large & UI; tokens above are pre-checked.
- Full keyboard operability (incl. `FieldSearch` ↑↓/Enter/Esc/Backspace, carousels, dialogs).
- Semantic landmarks (`header`/`nav`/`main`/`footer`), labelled controls, `alt` on event images, `aria-live` for async/errors.
- RTL-correct (logical properties `start/end`); dir-aware icons.

---

## 8. Success metrics (targets)
- **Performance:** Lighthouse mobile ≥ 90; LCP < 2.5s; CLS < 0.1; INP < 200ms.
- **Accessibility:** Lighthouse a11y ≥ 95; axe: 0 criticals; AA contrast everywhere.
- **Engagement KPIs:** home→/tickets CTR; /tickets→event-detail CTR; detail→checkout conversion; checkout completion; bounce on /tickets.

---

## 9. Scope & phasing
- **Phase 0** — This spec + dark token system + fonts + shared primitives (buttons, inputs, badges, skeleton, focus). ← *current*
- **Phase 1** — Storefront: home (hero search + carousels), `/tickets` (filters + tiles), event detail.
- **Phase 2** — Conversion: checkout, auth (login/signup/verify/reset).
- **Phase 3** — Account dashboard (buyer/seller/sell/verify/settings).
- **Phase 4** — Admin backoffice.

Out of scope (this initiative): backend/business-logic changes, new features, payments integration.
