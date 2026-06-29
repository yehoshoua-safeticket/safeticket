# Mobile Hero spacing + Footer redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-first: tighten the landing hero's vertical whitespace, and turn the footer solid-black with pure-white text, white social icons, and a flush-bottom legal bar.

**Architecture:** Pure presentation edits to two existing client components (`page.tsx` hero section, `Footer.tsx`), one new i18n key (added to `he.ts` first since `Translations = typeof he`, then `en.ts`), a new `react-icons` dependency for brand glyphs, and a small self-contained `/cookies` stub page.

**Tech Stack:** Next.js 16 (App Router, non-standard build — see `AGENTS.md`), React 19, Tailwind CSS v4, `react-icons/fa6`, custom cookie-based i18n (`useLocale()`).

## Global Constraints

- Mobile-first: ~90% of users are on mobile. Tighten/style mobile; preserve existing `sm:`+ (desktop) rendering unless a change is explicitly mobile-and-up.
- RTL-safe: locale `he` renders RTL. No hard-coded `left`/`right`; use logical props (`start`/`end`), `gap`, `justify-center`.
- i18n shape authority is `src/i18n/he.ts` (`export type Translations = typeof he`). Any new key goes into `he.ts` first, then `en.ts`, or the build fails.
- All footer text is **pure white** (`text-white`); interactive links may dim on hover (`hover:text-white/70`).
- Social icons are **white/monochrome**, `href="#"` placeholders, order: X, Instagram, Facebook, YouTube.
- Verification gate is `npm run build` (no test framework in this repo). Read `node_modules/next/dist/docs/` before using any Next.js API — but these tasks use none.
- Per user memory: commit **and** push to `origin/main` after each task; work on `main`, no `Co-Authored-By` line.

## File Structure

- `src/app/(public)/page.tsx` — MODIFY hero `<section>` + subtitle classes only.
- `src/components/layout/Footer.tsx` — MODIFY: background, text colors, add social-icon row, rebuild bottom legal bar.
- `src/i18n/he.ts` — MODIFY: add `footer.cookies`.
- `src/i18n/en.ts` — MODIFY: add `footer.cookies`.
- `src/app/(public)/cookies/page.tsx` — CREATE: minimal stub page.
- `package.json` / `package-lock.json` — MODIFY: add `react-icons`.

---

### Task 1: Add `react-icons` dependency

**Files:**
- Modify: `package.json` (dependencies), `package-lock.json` (auto)

**Interfaces:**
- Consumes: nothing.
- Produces: `react-icons/fa6` exports `FaXTwitter`, `FaInstagram`, `FaFacebookF`, `FaYoutube` (each a React component accepting `className`, `aria-hidden`, etc.), available to Task 4.

- [ ] **Step 1: Install the package**

Run from `/Users/yehoshoua/Desktop/safe-ticket/safe-ticket`:
```bash
npm install react-icons
```
Expected: `package.json` gains `"react-icons": "^5.x.x"` under `dependencies`; `package-lock.json` updates; exit 0.

- [ ] **Step 2: Verify the icons resolve**

Run:
```bash
node -e "const i=require('react-icons/fa6'); console.log(['FaXTwitter','FaInstagram','FaFacebookF','FaYoutube'].map(k=>k+':'+(typeof i[k])).join(' '))"
```
Expected: `FaXTwitter:function FaInstagram:function FaFacebookF:function FaYoutube:function`

- [ ] **Step 3: Commit and push**

```bash
git add package.json package-lock.json
git commit -m "build: add react-icons for footer social glyphs"
git push origin main
```

---

### Task 2: Tighten hero vertical spacing (mobile-first)

**Files:**
- Modify: `src/app/(public)/page.tsx` (hero `<section>` ~line 132; subtitle `<motion.p>` ~line 158)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (visual only).

- [ ] **Step 1: Reduce the hero section's min-height + vertical padding on mobile**

In `src/app/(public)/page.tsx`, the hero section opening tag currently reads:
```tsx
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-8 text-center">
```
Replace the className with (mobile tightened, `sm:` restores the originals):
```tsx
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 pb-10 pt-4 text-center sm:min-h-[88vh] sm:pb-16 sm:pt-8">
```

- [ ] **Step 2: Reduce the subtitle's top gap on mobile**

The subtitle `<motion.p>` className currently contains `mt-5 max-w-2xl ... sm:mt-6`. Change `mt-5` → `mt-4`:
```tsx
          className="relative z-10 mt-4 max-w-2xl text-lg leading-relaxed text-white/60 sm:mt-6 sm:text-2xl"
```
(Only `mt-5`→`mt-4` changes; leave the rest of the class string intact.)

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds, no type/lint errors.

- [ ] **Step 4: Commit and push**

```bash
git add src/app/\(public\)/page.tsx
git commit -m "feat(home): tighten hero vertical spacing on mobile"
git push origin main
```

---

### Task 3: Add `footer.cookies` i18n key (he then en)

**Files:**
- Modify: `src/i18n/he.ts` (the `footer:` object, ~line 120)
- Modify: `src/i18n/en.ts` (the `footer:` object, ~line 122)

**Interfaces:**
- Consumes: nothing.
- Produces: `t.footer.cookies` (string) for Tasks 4 and 5.

- [ ] **Step 1: Add the key to `he.ts` FIRST (type authority)**

In `src/i18n/he.ts`, inside the `footer:` object, add a `cookies` entry next to `privacy`:
```ts
    terms: 'תנאי שימוש',
    privacy: 'פרטיות',
    cookies: 'מדיניות עוגיות',
```

- [ ] **Step 2: Add the matching key to `en.ts`**

In `src/i18n/en.ts`, inside the `footer:` object, mirror it:
```ts
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
```

- [ ] **Step 3: Build to verify both locales still satisfy `Translations`**

Run: `npm run build`
Expected: build succeeds. (If `en` were missing the key, TS would error that `en` is not assignable to `Translations`.)

- [ ] **Step 4: Commit and push**

```bash
git add src/i18n/he.ts src/i18n/en.ts
git commit -m "i18n: add footer.cookies label (he, en)"
git push origin main
```

---

### Task 4: Footer redesign — black bg, white text, social icons, bottom legal bar

**Files:**
- Modify: `src/components/layout/Footer.tsx` (whole component body)

**Interfaces:**
- Consumes: `react-icons/fa6` (Task 1); `t.footer.cookies` (Task 3); existing `t.footer.*` labels.
- Produces: nothing (visual only).

- [ ] **Step 1: Add the brand-icon import**

At the top of `src/components/layout/Footer.tsx`, below the existing imports, add:
```tsx
import { FaXTwitter, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa6';
```

- [ ] **Step 2: Replace the `<footer>` opening tag (solid black, no blur)**

Change:
```tsx
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md">
```
to:
```tsx
    <footer className="border-t border-white/10 bg-black">
```

- [ ] **Step 3: Rebuild the brand column — pure-white tagline + white social icon row**

Replace the brand column block (the `<div className="col-span-2 sm:col-span-1">` … `</div>` that holds the logo, name, and tagline) with:
```tsx
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logos/st-logo.png" alt="" className="h-8 w-auto" />
              <span className="text-base font-bold text-white">SafeTicket</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white">
              {t.footer.tagline}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <a href="#" aria-label="X" className="text-white transition hover:text-white/70">
                <FaXTwitter className="h-5 w-5" aria-hidden />
              </a>
              <a href="#" aria-label="Instagram" className="text-white transition hover:text-white/70">
                <FaInstagram className="h-5 w-5" aria-hidden />
              </a>
              <a href="#" aria-label="Facebook" className="text-white transition hover:text-white/70">
                <FaFacebookF className="h-5 w-5" aria-hidden />
              </a>
              <a href="#" aria-label="YouTube" className="text-white transition hover:text-white/70">
                <FaYoutube className="h-5 w-5" aria-hidden />
              </a>
            </div>
          </div>
```

- [ ] **Step 4: Make the three link columns pure white**

For each of the three remaining columns (Platform, Support, Legal), change the heading class `text-white/40` → `text-white`, and every link class `text-white/60 transition hover:text-white` → `text-white transition hover:text-white/70`. The three headings to update:
```tsx
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{t.footer.platform}</h4>
```
```tsx
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{t.footer.support}</h4>
```
```tsx
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{t.footer.legal}</h4>
```
And every `<li><Link … className="text-sm text-white/60 transition hover:text-white">` becomes `className="text-sm text-white transition hover:text-white/70"` (7 links total: tickets, sellTicket, howItWorks, faq, contact, disputes, terms, privacy — update each occurrence).

- [ ] **Step 5: Replace the bottom copyright block with a flush-bottom centered legal bar**

Change the closing block:
```tsx
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/35">{t.footer.copyright}</p>
        </div>
```
to (copyright + Cookie Policy on row 1, Terms · Privacy on row 2, all centered, white):
```tsx
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white">{t.footer.copyright}</p>
          <div className="flex flex-col items-center gap-2">
            <Link href="/cookies" className="text-sm text-white transition hover:text-white/70">{t.footer.cookies}</Link>
            <div className="flex items-center justify-center gap-2 text-sm text-white">
              <Link href="/terms" className="transition hover:text-white/70">{t.footer.terms}</Link>
              <span aria-hidden className="text-white/40">·</span>
              <Link href="/privacy" className="transition hover:text-white/70">{t.footer.privacy}</Link>
            </div>
          </div>
        </div>
```

- [ ] **Step 6: Reduce the outer container's bottom padding so the legal bar sits flush to the page bottom**

The footer's inner container currently is `<div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">`. Change `py-12` → `pb-6 pt-12` (keep generous top padding, tighten the bottom so the legal bar is flush):
```tsx
      <div className="mx-auto max-w-6xl px-5 pb-6 pt-12 sm:px-8">
```

- [ ] **Step 7: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds, no type/lint errors.

- [ ] **Step 8: Commit and push**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat(footer): solid black, white text + social icons, flush bottom legal bar"
git push origin main
```

---

### Task 5: `/cookies` stub page

**Files:**
- Create: `src/app/(public)/cookies/page.tsx`

**Interfaces:**
- Consumes: `useLocale()` → `t.footer.cookies`, `t.legal.draftNotice`, `t.legal.lastUpdated`, `t.legal.questions`, `t.legal.contactLink`.
- Produces: a resolvable `/cookies` route (no 404).

- [ ] **Step 1: Create the stub page**

Create `src/app/(public)/cookies/page.tsx` with:
```tsx
'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

export default function CookiesPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.footer.cookies}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.legal.lastUpdated}</p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-sm text-amber-700">{t.legal.draftNotice}</p>
      </div>

      <p className="mt-10 text-sm text-[var(--muted)]">
        {t.legal.questions}{' '}
        <Link href="/contact" className="text-[var(--accent-text)] hover:underline">{t.legal.contactLink}</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify the route compiles**

Run: `npm run build`
Expected: build succeeds; `/cookies` appears in the route manifest output.

- [ ] **Step 3: Verify `t.legal.contactLink` exists (guard against a missing key)**

Run:
```bash
grep -n "contactLink" src/i18n/he.ts src/i18n/en.ts
```
Expected: a match in BOTH files. If missing in either, the build in Step 2 would already have failed type-check — if so, stop and report rather than inventing a key.

- [ ] **Step 4: Commit and push**

```bash
git add src/app/\(public\)/cookies/page.tsx
git commit -m "feat(cookies): minimal cookie-policy stub page"
git push origin main
```

---

### Task 6: Final visual verification (mobile)

**Files:** none (verification only).

**Interfaces:**
- Consumes: all prior tasks.
- Produces: confirmation evidence.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (note the local URL, typically `http://localhost:3000`).

- [ ] **Step 2: Verify at a mobile viewport (375×812)**

Load `/` and check:
- Hero title has visibly tighter top/bottom whitespace than before; subtitle sits just below it.
- Footer is solid black, all text pure white, 4 white social icons (X, Instagram, Facebook, YouTube) under the tagline.
- Bottom bar: copyright, then Cookie Policy on its own row, then Terms · Privacy on the next row — all centered, flush to the bottom edge.

Then load `/cookies` — page renders (no 404), heading shows the localized "Cookie Policy".

- [ ] **Step 3: Verify RTL (he locale)**

With locale = `he` (default), confirm the footer bottom bar is still centered and does not overflow horizontally; social-icon row and legal links read correctly in RTL.

- [ ] **Step 4: Report**

Summarize what was observed (with a screenshot if the harness supports it). No commit needed unless a fix was required.

---

## Self-Review

**Spec coverage:**
- Hero margin reduction → Task 2. ✓
- Footer solid black → Task 4 Step 2. ✓
- Footer white text → Task 4 Steps 3–5 (pure `text-white`). ✓
- Social icons X/Instagram/Facebook/YouTube → Task 1 (dep) + Task 4 Step 3, white, `href="#"`. ✓
- Bottom legal bar, Cookie Policy on row 1 + Terms/Privacy on row 2, centered, flush bottom → Task 4 Steps 5–6. ✓
- New `footer.cookies` i18n (he-first) → Task 3. ✓
- `/cookies` stub → Task 5. ✓
- `react-icons` dependency → Task 1. ✓
- Commit + push each step (user memory) → every task. ✓

**Placeholder scan:** No TBD/TODO; all code shown verbatim; `href="#"` is the intended placeholder per spec (not a plan gap).

**Type consistency:** `t.footer.cookies` defined in Task 3, consumed in Tasks 4–5. Icon component names (`FaXTwitter`, `FaInstagram`, `FaFacebookF`, `FaYoutube`) identical in Task 1 verification and Task 4 import. Reused `t.legal.*` keys verified to exist (Task 5 Step 3).

**Note for executor:** `AGENTS.md` warns this Next.js fork differs from training data — but no task here calls a Next.js API (only JSX/Tailwind/an npm install), so no `node_modules/next/dist/docs/` reading is required.
