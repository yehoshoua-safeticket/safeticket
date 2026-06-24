# SafeTicket — Full Redesign Design Spec
**Date:** 2026-06-18  
**Status:** Approved & Implemented  
**Scope:** All phases (public site, dashboard, admin)

---

## 1. Design Direction

**Style:** Dark & Premium — "Stage" aesthetic  
**References:** Stripe.com, Apple.com/ipad-air, Viagogo dark  
**Core feeling:** You are stepping into a venue. The background is a real stage with blue spotlights and smoke. The interface floats over it as glass panels.

The key principle: **one fixed background, everything else floats.**

---

## 2. Background System

### Hero background image
- **File:** `/public/hero-bg.jpg`
- **Source:** Pngtree stage spotlight (1920×1080 JPEG, 568KB)
- **Usage:** Fixed behind the entire public site via `(public)/layout.tsx`
- **Sizing:** 1920×1080 for desktop, crops to centre on mobile (portrait)

### Colour-grade overlay
Applied on top of the photo to push blue saturation and control contrast:
```css
linear-gradient(140deg,
  rgba(0,10,40,0.82)   0%,
  rgba(0,40,140,0.50)  45%,
  rgba(0,12,50,0.85)   100%
)
```

### Implementation
```tsx
/* (public)/layout.tsx */
{/* Fixed background image — z-index 0 */}
<div style={{ position:'fixed', inset:0, zIndex:0,
  backgroundImage:'url(/hero-bg.jpg)',
  backgroundSize:'cover', backgroundPosition:'center' }} />

{/* Colour-grade overlay — z-index 1 */}
<div style={{ position:'fixed', inset:0, zIndex:1,
  background: OVERLAY }} />

{/* All content — z-index 2 */}
<div style={{ position:'relative', zIndex:2 }}>
  ...
</div>
```

### Fallback
Root div always has `background: '#010b1e'` — if the image fails to load the page remains dark and readable.

### Admin / Dashboard
No background image. Clean flat dark navy:
- `#010b1e` base
- `#0d1a2e` surface (sidebar, cards)
- `#162236` input fields

---

## 3. Colour Tokens

### Brand palette (unchanged)
| Token | Value | Usage |
|-------|-------|-------|
| Brand blue | `#0044cc` | CTAs, badges, active states |
| Deep navy | `#062b73` | Gradients, overlays |
| White | `#ffffff` | All text on dark bg |
| Near-black navy | `#001e3d` | Dark surfaces |

### Dark-theme CSS var overrides
Applied in `(public)/layout.tsx`, `admin/layout.tsx`, `dashboard/layout.tsx`:

```css
--background:       transparent          /* public */ / #010b1e   /* admin */
--surface:          rgba(255,255,255,0.06) / #0d1a2e
--surface-2:        rgba(255,255,255,0.10) / #162236
--card:             rgba(255,255,255,0.08) / #0d1a2e
--card-border:      rgba(255,255,255,0.14) / rgba(255,255,255,0.08)
--foreground:       #ffffff
--muted:            rgba(255,255,255,0.52) / rgba(255,255,255,0.50)
--accent:           #0044cc
--accent-hover:     #0038aa
--accent-text:      #4d94ff  (lighter than brand blue for legibility on dark)
--accent-soft:      rgba(0,68,204,0.20-0.25)
--input-bg:         rgba(255,255,255,0.08) / #162236
--input-border:     rgba(255,255,255,0.20) / rgba(255,255,255,0.15)
--danger:           #f87171
--success:          #4ade80
--warning:          #fbbf24
```

All existing components use these vars — they adapt to dark automatically without code changes.

---

## 4. Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / headings | Rubik | 700–900 | Hebrew + Latin support |
| Body | Assistant | 400–600 | Hebrew + Latin support |
| Overlines | Assistant | 700 | `uppercase tracking-wider text-xs` |

**Scale (public hero):**
- H1: `text-5xl → text-[5.5rem]`, `letter-spacing: -0.03em`, `line-height: 1.0`
- H2: `text-2xl → text-3xl`
- Body: `text-base`, `leading-relaxed`
- Overline: `text-[0.68rem] uppercase tracking-widest font-bold`

**Colour:** All text `text-white` on the dark background. Muted text uses `text-white/50–60`.

---

## 5. Component Patterns

### Glass card
Used for escrow steps, event cards, FAQ items, comparison panels:
```
border border-white/15  bg-white/10  backdrop-blur-md  rounded-2xl
```

### Frosted strip (stats bar, trust feature bar)
```
border-y border-white/10  bg-white/5  backdrop-blur-sm
```

### Navbar
```
sticky top-0 z-50
border-b border-white/10  bg-white/25  backdrop-blur-md
```
Uses CSS vars → adapts with theme. White text on dark background.

### Footer
```
border-t border-white/10  bg-black/20  backdrop-blur-md
```

### Search bar (hero)
```
rounded-2xl  border border-white/20  bg-white/12
p-2  shadow-2xl shadow-black/40  backdrop-blur-xl
```

### CTA buttons
- **Primary:** `bg-white text-[#0044cc]` (white on dark sections) or `bg-[#0044cc] text-white` (blue on glass)
- **Secondary:** `border border-white/25 text-white/80`

### Category chips / nav pills
```
border border-white/15  bg-white/8  backdrop-blur-sm  rounded-full
text-white/65
hover: border-white/30 bg-white/15 text-white
```

---

## 6. Admin / Dashboard Sidebar Pattern

Both `AdminSidebar` and `AccountSidebar` use CSS vars throughout.
Active nav item:
```
border-s-[3px] border-[var(--accent)]
bg-[var(--accent-soft)]
text-[var(--accent-text)]
```
Inactive:
```
border-transparent
text-[var(--muted)]
hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]
```

---

## 7. Animation

**Library:** `motion` v12 (`motion/react`)

### Entrance animations (public pages)
- **Hero content:** staggered `opacity 0→1, y 28→0`, delays `0.1s → 0.65s`
- **Section cards:** `whileInView`, `opacity 0→1, y 20→0`, delay `i * 0.12s`
- **Event carousel:** `x 24→0` staggered by index

### Scroll cue
```tsx
<motion.div animate={{ y: [0,7,0] }} transition={{ duration:1.6, repeat:Infinity }}>
  <ArrowDown />
</motion.div>
```

### Stats counter
`useInView` with `once: true, margin: '-80px'` — animates in when entering viewport.

---

## 8. Layout System

### Public site
```
(public)/layout.tsx
  Fixed bg image (z-0)
  Fixed overlay  (z-1)
  Content wrapper (z-2, dark CSS vars)
    <Navbar /> — sticky top-0 z-50
    <main />
    <Footer />
```

### Admin
```
admin/layout.tsx
  Dark vars + bg #010b1e
    <AdminSidebar /> — w-60, fixed left
    <main />
```

### Dashboard
```
dashboard/layout.tsx
  Dark vars + bg #010b1e
    <AccountSidebar /> — w-64, fixed right (RTL-aware)
    <main />
```

---

## 9. Homepage Section Structure

1. **Hero** — full viewport, badge + H1 + search bar + category chips + scroll cue
2. **Stats strip** — frosted bar: 100% / <24h / ₪0
3. **Events carousel** — glass cards, horizontal scroll, Supabase data
4. **How it works** — 3 glass cards: 01 pay / 02 receive / 03 confirm
5. **Trust features** — 3 icon rows: escrow / verified / refund
6. **Comparison** — red-tinted "Others" vs blue-tinted "SafeTicket"
7. **FAQ** — 5 collapsible accordion items (from `t.faq.items`)
8. **CTA** — headline + 2 buttons

---

## 10. i18n & RTL

- All user-facing strings via `useLocale()` and `t.` keys
- `dir="rtl"` set at `<html>` level by root layout
- Tailwind `start`/`end` used instead of `left`/`right` where directional
- Fonts (Rubik + Assistant) support both Hebrew and Latin scripts
- Date locale: `locale === 'he' ? 'he-IL' : 'en-US'`

---

## 11. Mobile Strategy

- Framework: Next.js App Router (stays — RSC = smallest JS on mobile)
- CSS: delivered as a single pre-built static file in production
- Background: JPEG at 1920px, `object-position: center` — crops on portrait
- Video autoplay fix: `position: absolute` → switch to `position: fixed` via JS `playing` event (iOS Safari requirement)
- ngrok header: `ngrok-skip-browser-warning: true` on all responses (in `next.config.ts`)
- Target asset weight: images < 600KB, no video as background

---

## 12. Phase Rollout

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Homepage (`/`) | ✅ Complete |
| 2 | All public pages (tickets, how-it-works, faq, auth, contact…) | ✅ Complete |
| 3 | Authenticated dashboard (buyer, seller, sell, verify, settings) | ✅ Complete |
| 4 | Admin / backoffice | ✅ Complete |
