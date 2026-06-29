# Mobile Hero spacing + Footer redesign

**Date:** 2026-06-29
**Scope:** Presentation-only changes to the public landing page hero and the global footer, mobile-first (≈90% of users are on mobile). Plus a minimal `/cookies` stub page and one new i18n label.

## Context

- `src/app/(public)/page.tsx` — landing page; hero is the first `<section>` (line ~132), animated `<h1>` + subtitle below it.
- `src/components/layout/Footer.tsx` — global footer, hidden on `/dashboard` and `/admin`. Currently glassy (`bg-black/20 backdrop-blur-md`), 4-column link grid, single centered copyright line.
- `src/i18n/he.ts` — **canonical translation shape** (`export type Translations = typeof he`). `en.ts` must structurally match it or the build fails. So any new key is added to `he.ts` first, then `en.ts`.
- `src/i18n/LocaleProvider.tsx` — `useLocale()` returns `{ t, locale, dir }`.
- Installed `lucide-react@1.16.0` has **no brand/social icons** (verified: only a generic `x` close glyph). Brand marks must come from elsewhere.
- `LegalDoc` (`src/components/ui/LegalDoc.tsx`) is typed `doc: 'terms' | 'privacy'` and reads `t.legal[doc]`. We deliberately do **not** extend it for cookies (would force a new `legal.cookies` sub-object in both locales). The cookies stub is self-contained and reuses existing `t.legal.draftNotice / lastUpdated / questions`.

## Decisions (locked with user)

- Social icons via **`react-icons`** package (`react-icons/fa6`): `FaXTwitter`, `FaInstagram`, `FaFacebookF`, `FaYoutube`.
- Icons rendered **white / monochrome** (not brand colors), `href="#"` placeholders, placed **under the logo + tagline** in the footer's brand column.
- Footer background **solid black**; **all footer text pure white** (`text-white`), with a subtle hover dim (`hover:text-white/70`) on interactive links for affordance.
- Bottom legal bar: **Cookie Policy** on row 1, **Terms of Service · Privacy Policy** on row 2, **centered**, pinned flush to the bottom of the footer.
- Add a **minimal `/cookies` stub page** so the link resolves.

## Changes

### 1. Hero vertical spacing — `page.tsx` (mobile-first)

The hero `<section>` currently: `min-h-[88vh] … px-6 pb-16 pt-8`. The title's whitespace is dominated by this tall centered block + vertical padding. Tighten on mobile, restore on `sm+`:

- Section: `min-h-[88vh] pb-16 pt-8` → `min-h-[70vh] pb-10 pt-4 sm:min-h-[88vh] sm:pb-16 sm:pt-8`.
- Subtitle top gap: `mt-5` → `mt-4` (keep `sm:mt-6`).

No change to the `<h1>` font sizes, animation, or background layers. Desktop (`sm:` and up) renders exactly as before.

### 2. Footer — `Footer.tsx`

- **Background:** `border-t border-white/10 bg-black/20 backdrop-blur-md` → `border-t border-white/10 bg-black` (remove translucency + blur).
- **Text → pure white:** change muted whites to `text-white`:
  - Brand name already `text-white` (keep).
  - Tagline `text-white/50` → `text-white`.
  - Column headings `text-white/40` → `text-white`.
  - All link items `text-white/60 hover:text-white` → `text-white hover:text-white/70`.
  - Copyright `text-white/35` → `text-white`.
- **Social icon row:** directly under the tagline in the brand column, a horizontal row (`mt-4 flex items-center gap-4`) of 4 links, each `href="#"`, `aria-label` set, icon `className="h-5 w-5"`, link `className="text-white transition hover:text-white/70"`. Order: X, Instagram, Facebook, YouTube.
- **Bottom legal bar:** replace the current `mt-10 border-t … pt-6` single-line block with a centered, flush-to-bottom block:
  - Keep a top border + copyright line (`text-white`, centered).
  - Below it, two centered rows of links:
    - Row 1: Cookie Policy (`/cookies`).
    - Row 2: Terms of Service (`/terms`) · Privacy Policy (`/privacy`) — rendered on one centered flex row with a separator/gap.
  - Links styled `text-sm text-white hover:text-white/70`, RTL-safe (no hard-coded left/right; use `gap`, `justify-center`).
  - "Flush to bottom": minimal bottom padding on this block so it sits against the page bottom (reduce the outer container's `py-12` bottom contribution as needed, e.g. keep top padding, tighten bottom).

### 3. i18n — `he.ts` then `en.ts`

Add one key to the `footer` object **in `he.ts` first** (type authority), then the matching key in `en.ts`:
- `he.ts`: `cookies: 'מדיניות עוגיות'`
- `en.ts`: `cookies: 'Cookie Policy'`

No other i18n changes. The `/cookies` stub reuses existing `t.legal.draftNotice`, `t.legal.lastUpdated`, `t.legal.questions`, `t.legal.contactLink`.

### 4. `/cookies` stub page — `src/app/(public)/cookies/page.tsx` (new)

Minimal self-contained client page mirroring the visual frame of `LegalDoc` but without extending its type:
- `'use client'`, `useLocale()`.
- `max-w-3xl px-5 py-12 sm:px-8` container.
- `<h1>` = `t.footer.cookies`, `lastUpdated` line, the amber draft-notice box (reuse `t.legal.draftNotice`), a one-paragraph placeholder body, and the "questions → contact" line (reuse `t.legal.questions` + link to `/contact`).

### 5. Dependency — `package.json`

Add `react-icons` to `dependencies` (install so `package-lock.json` updates).

## Out of scope / non-goals

- Real social profile URLs (placeholders `#` until provided).
- Full cookie-policy legal copy (stub only).
- Any desktop-specific hero redesign beyond preserving current `sm+` rendering.
- Touching `LegalDoc`'s type union.

## Verification

- `npm run build` (or `tsc`) passes — confirms `en`/`he` shapes match after the new key.
- Mobile viewport: hero title sits with visibly tighter top/bottom whitespace; footer is solid black, white text, 4 white social icons under the tagline, and the bottom bar shows Cookie Policy on one row with Terms · Privacy beneath it, flush to the bottom.
- `/cookies` resolves (no 404) in both `he` and `en`.
- RTL (he) and LTR (en) both render the bottom bar centered without overflow.

## Commit

Per user memory: commit **and** push to `origin/main` (no `Co-Authored-By` line), working directly on `main`.
