'use client';

import { motion } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft,
  Tag, CreditCard, Lock, DoorOpen, Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event, EventCategory } from '@/types/database';

type EventWithListings = Event & { lowestPrice: number };
type CategoryTile = { category: EventCategory; image_url: string };

const CATEGORY_ORDER: EventCategory[] = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

const FLOW_ICONS = [Tag, CreditCard, Lock, DoorOpen, Wallet];

const FLOW_SCHEME = {
  activeIcon: '#1a55e3',
  doneIcon: '#5599ff',
};

export default function Home() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  // Carousel arrow glyphs: in RTL (Hebrew) the "previous" arrow points right and
  // "next" points left, so swap which chevron each control renders.
  const PrevIcon = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextIcon = locale === 'he' ? ChevronLeft : ChevronRight;

  const [featured, setFeatured] = useState<EventWithListings[]>([]);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [index, setIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const VISIBLE = 4;

  // Category carousel: scroll one full card at a time (RTL-aware).
  function scrollCategories(dir: 'prev' | 'next') {
    const el = catRef.current;
    if (!el) return;
    const card = el.querySelector('[data-cat-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : el.clientWidth; // card width + gap-3
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const sign = (dir === 'next' ? 1 : -1) * (isRTL ? -1 : 1);
    el.scrollBy({ left: sign * step, behavior: 'smooth' });
  }

  const [flowStep, setFlowStep] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);

  // Auto-advance the "how it works" flow on an interval.
  useEffect(() => {
    const id = setInterval(() => setFlowStep((s) => (s + 1) % 6), 1500);
    return () => clearInterval(id);
  }, []);

  function scrollCarousel(dir: 'prev' | 'next') {
    const maxIndex = Math.max(0, featured.length - VISIBLE);
    setIndex((prev) => {
      if (dir === 'next') return prev >= maxIndex ? 0 : prev + 1;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }

  // Apply the index to the track — RTL-safe (scrollLeft is negative in RTL)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !featured.length) return;
    const stride = el.scrollWidth / featured.length; // one card + gap
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const target = index * stride;
    el.scrollTo({ left: isRTL ? -target : target, behavior: 'smooth' });
  }, [index, featured]);

  // Auto-scroll every 3.5 s (desktop carousel)
  useEffect(() => {
    if (featured.length <= VISIBLE) return;
    const id = setInterval(() => scrollCarousel('next'), 3500);
    return () => clearInterval(id);
  }, [featured]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      // Curated homepage data. A missing table just yields an empty result
      // (PostgREST 404 → error, data null), so each section hides cleanly.
      supabase.from('featured_events').select('event_id, position, event:events(*)').order('position', { ascending: true }),
      supabase.from('category_covers').select('category, event:events(*)'),
      supabase.from('listings').select('event_id, asking_price').eq('status', 'active'),
    ]).then(([featR, covR, liR]) => {
      // Lowest active price per event.
      const prices = new Map<string, number[]>();
      for (const l of liR.data || []) {
        if (!prices.has(l.event_id)) prices.set(l.event_id, []);
        prices.get(l.event_id)!.push(l.asking_price);
      }

      // Featured: only events that actually have an image (hide-until-set).
      type FeatRow = { event: Event | null };
      const feat = ((featR.data as FeatRow[] | null) || [])
        .map((row) => row.event)
        .filter((e): e is Event => !!e && !!e.image_url)
        .slice(0, 5)
        .map((e) => {
          const p = prices.get(e.id) || [];
          return { ...e, lowestPrice: p.length ? Math.min(...p) : 0 } as EventWithListings;
        });
      setFeatured(feat);

      // Category tiles: one per category that has a cover event WITH an image.
      type CovRow = { category: EventCategory; event: Event | null };
      const coverByCat = new Map<EventCategory, string>();
      for (const row of (covR.data as CovRow[] | null) || []) {
        if (row.event?.image_url) coverByCat.set(row.category, row.event.image_url);
      }
      const tiles = CATEGORY_ORDER
        .filter((c) => coverByCat.has(c))
        .map((c) => ({ category: c, image_url: coverByCat.get(c)! }));
      setCategories(tiles);
    });
  }, []);

  return (
    <>
      {/* ── HERO (only — events sit below the fold) ──
          Pulled up under the sticky translucent navbar + search strip (~106px)
          so the wallpaper fills behind them — no dark page-bg band shows. */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 pb-10 pt-4 text-center sm:min-h-[88vh] sm:pb-16 sm:pt-8">
        {/* Logo-blue colour-grade overlay — temporarily disabled */}
        {/* <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: 'linear-gradient(140deg, rgba(9,21,47,0.85) 0%, rgba(26,85,227,0.42) 45%, rgba(9,21,47,0.88) 100%)' }}
        /> */}

        <motion.h1
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22 }}
          className="relative z-10 max-w-4xl text-[2.75rem] font-black text-[#1a55e3] sm:text-6xl lg:text-[5.5rem]"
          style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t.home.heroLine1}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
          className="relative z-10 mt-4 max-w-2xl text-lg leading-relaxed text-[#1a55e3] sm:mt-6 sm:text-2xl"
        >
          {t.home.whySafeSubtitle}
        </motion.p>
      </section>

      {/* ── FEATURED EVENTS (only rendered when there are image-backed featured events) ── */}
      {featured.length > 0 && (
        <section className="pb-8 sm:pb-12 md:px-14">
          {/* Mobile: full-bleed banner cards, edge-to-edge, stacked */}
          <div className="flex flex-col gap-1.5 px-2 md:hidden">
            {featured.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link href={`/tickets/${ev.id}`} className="relative block h-56 w-full overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ev.image_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-5">
                    <span className="inline-block rounded-full bg-[#1a55e3] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      {t.eventCategory[ev.category] ?? ev.category}
                    </span>
                    <p className="text-2xl font-extrabold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{ev.title}</p>
                    <p className="text-sm text-white/70">
                      {new Date(ev.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' })}
                      {ev.city && ` · ${ev.city}`}
                    </p>
                    {ev.lowestPrice > 0 && (
                      <p className="mt-0.5 text-base font-bold text-white">
                        {t.home.fromPrice.replace('{price}', String(ev.lowestPrice))}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto max-w-5xl">
            {/* Desktop: 4-up carousel with chevrons */}
            <div className="relative mx-auto hidden max-w-5xl md:block">
              <div ref={carouselRef} className="flex overflow-x-hidden" style={{ gap: '1rem' }}>
                {featured.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="flex-none overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] backdrop-blur-md"
                    style={{ width: 'calc((100% - 3rem) / 4)', flexShrink: 0, flexGrow: 0 }}
                  >
                    <Link href={`/tickets/${ev.id}`}>
                      <div className="relative h-28 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ev.image_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="cover-scrim" />
                        <span className="absolute bottom-2 start-2 rounded-full bg-[#1a55e3] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-white">
                          {t.eventCategory[ev.category] ?? ev.category}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-semibold text-[var(--foreground)]">{ev.title}</p>
                        <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">
                          {new Date(ev.event_date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                          {ev.city && ` · ${ev.city}`}
                        </p>
                        {ev.lowestPrice > 0 && (
                          <p className="mt-1 text-xs font-bold text-[#5599ff]">₪{ev.lowestPrice}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {featured.length > VISIBLE && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('prev')}
                    className="absolute -start-12 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition hover:bg-[var(--accent-soft)]"
                    aria-label="Previous"
                  >
                    <PrevIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('next')}
                    className="absolute -end-12 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition hover:bg-[var(--accent-soft)]"
                    aria-label="Next"
                  >
                    <NextIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES (only rendered when at least one category has an image cover) ── */}
      {categories.length > 0 && (
        <section className="px-5 py-8 sm:py-10 md:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-[var(--foreground)] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              {t.home.categoriesTitle}
            </h2>

            {/* Mobile: one-card-at-a-time carousel (native swipe + arrows) */}
            <div className="relative md:hidden">
              <div
                ref={catRef}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {categories.map((tile, i) => (
                  <motion.div
                    key={tile.category}
                    data-cat-card
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="w-full shrink-0 snap-center"
                  >
                    <Link href={`/tickets?category=${tile.category}`} className="group relative block h-56 w-full overflow-hidden rounded-2xl border border-[var(--card-border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tile.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <span className="absolute bottom-4 start-4 text-2xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {t.eventCategory[tile.category] ?? tile.category}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {categories.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollCategories('prev')}
                    aria-label="Previous"
                    className="absolute start-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition active:bg-[var(--accent-soft)]"
                  >
                    <PrevIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategories('next')}
                    aria-label="Next"
                    className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition active:bg-[var(--accent-soft)]"
                  >
                    <NextIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Desktop: horizontal scroll row of (larger) tiles */}
            <div className="hidden snap-x snap-mandatory justify-center gap-4 overflow-x-auto pb-2 md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((tile, i) => (
                <motion.div
                  key={tile.category}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="snap-start"
                >
                  <Link
                    href={`/tickets?category=${tile.category}`}
                    className="group relative block h-52 w-72 shrink-0 overflow-hidden rounded-2xl border border-[var(--card-border)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tile.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute bottom-3 start-3 text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {t.eventCategory[tile.category] ?? tile.category}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS — simple 5-step flow ── */}
      <div ref={flowRef} className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--foreground)] sm:mb-12 sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            {t.home.flowTitle}
          </h2>

          <div className="mx-auto flex max-w-2xl flex-row flex-wrap items-start justify-center gap-x-0 gap-y-6 sm:gap-y-8">
            {FLOW_ICONS.map((Icon, i) => {
              const active = i === flowStep;
              const done = i < flowStep;
              const s = FLOW_SCHEME;
              return (
                <div key={i} className="flex basis-1/3 flex-col items-center">
                  <motion.div
                    animate={{ scale: active ? 1.06 : 1, opacity: active || done ? 1 : 0.85 }}
                    transition={{ duration: 0.4 }}
                    className="flex w-full flex-col items-center gap-3 text-center"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                      {/* Smoke halo */}
                      {active && (
                        <motion.span
                          aria-hidden
                          animate={{ scale: [1, 1.25, 1.1, 1.3, 1], opacity: [0.7, 0.95, 0.8, 1, 0.7] }}
                          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                          className="pointer-events-none absolute -inset-5 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(26,85,227,0.35) 0%, rgba(85,153,255,0.25) 40%, transparent 70%)',
                            filter: 'blur(14px)',
                          }}
                        />
                      )}
                      <Icon
                        className="relative h-12 w-12 transition-colors duration-300 sm:h-16 sm:w-16"
                        strokeWidth={1}
                        style={{
                          color: active ? s.activeIcon : done ? s.doneIcon : 'var(--muted)',
                          filter: active
                            ? 'drop-shadow(0 0 12px rgba(26,85,227,0.45)) drop-shadow(0 0 26px rgba(85,153,255,0.4))'
                            : 'none',
                        }}
                      />
                      {/* Check merged into the icon, white — stroke draws itself */}
                      {(active || done) && (
                        <svg
                          className="absolute h-7 w-7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.45))' }}
                        >
                          <motion.path
                            d="M4 12l5 5L20 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                          />
                        </svg>
                      )}
                    </div>
                    <p className="mt-3 max-w-[6.5rem] px-1 text-[0.7rem] font-bold leading-snug text-[var(--foreground)] sm:max-w-[8rem] sm:text-xs">
                      {t.home.flowSteps[i]}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
