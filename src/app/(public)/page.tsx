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
  activeIcon: '#026CDF',
  doneIcon: '#4191E7',
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
  const VISIBLE = 1; // full-bleed hero shows one featured event at a time (Ticketmaster "Highlights")

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

  // Auto-advance the hero every 6 s (paused when the viewer prefers reduced motion)
  useEffect(() => {
    if (featured.length <= VISIBLE) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => scrollCarousel('next'), 6000);
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
      {/* ── HERO — full-bleed featured "Highlights" carousel (Ticketmaster-style) ── */}
      {featured.length > 0 ? (
        <section
          className="relative w-full overflow-hidden"
          aria-roledescription="carousel"
          aria-label={t.home.categoriesTitle}
        >
          <div ref={carouselRef} className="flex overflow-x-hidden">
            {featured.map((ev) => (
              <div
                key={ev.id}
                role="group"
                aria-roledescription="slide"
                aria-label={ev.title}
                className="relative h-[56vh] min-h-[380px] w-full flex-none sm:h-[64vh]"
                style={{ width: '100%', flexShrink: 0, flexGrow: 0 }}
              >
                <Link href={`/tickets/${ev.id}`} className="group block h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ev.image_url!} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="mx-auto max-w-6xl px-6 pb-14 pt-8 sm:px-8 sm:pb-16">
                      <span className="inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        {t.eventCategory[ev.category] ?? ev.category}
                      </span>
                      <h1
                        className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl"
                        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                      >
                        {ev.title}
                      </h1>
                      <p className="mt-3 text-base text-white/80 sm:text-lg">
                        {new Date(ev.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                        {ev.city && ` · ${ev.city}`}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-[var(--accent-hover)]">
                          {t.home.findTickets}
                        </span>
                        {ev.lowestPrice > 0 && (
                          <span className="font-mono-nums text-sm font-semibold text-white/90">
                            {t.home.fromPrice.replace('{price}', String(ev.lowestPrice))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {featured.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollCarousel('prev')}
                className="absolute start-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
                aria-label="Previous"
              >
                <PrevIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('next')}
                className="absolute end-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
                aria-label="Next"
              >
                <NextIcon className="h-5 w-5" />
              </button>

              <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center">
                {featured.map((ev, i) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`${i + 1}`}
                    aria-current={i === index}
                    className="flex h-8 items-center px-1.5"
                  >
                    <span className={`block h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        /* Fallback hero when no featured events — Aurora gradient + headline + search CTA */
        <section className="aurora-gradient relative flex min-h-[42vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center sm:min-h-[52vh]">
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative z-10 max-w-4xl text-4xl font-black text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            {t.home.heroLine1}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="relative z-10 mt-4 max-w-2xl text-lg leading-relaxed text-white/85 sm:mt-6 sm:text-xl"
          >
            {t.home.whySafeSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
          >
            <Link
              href="/tickets"
              className="relative z-10 mt-8 inline-flex items-center rounded-md bg-white px-7 py-3 text-sm font-bold uppercase tracking-wider text-[var(--accent-text)] shadow-lg transition hover:bg-white/90"
            >
              {t.home.findTickets}
            </Link>
          </motion.div>
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
                            background: 'radial-gradient(circle, rgba(2,108,223,0.35) 0%, rgba(65,145,231,0.25) 40%, transparent 70%)',
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
                            ? 'drop-shadow(0 0 12px rgba(2,108,223,0.45)) drop-shadow(0 0 26px rgba(65,145,231,0.4))'
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
