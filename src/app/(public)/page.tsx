'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronRight, ChevronLeft,
  Tag, CreditCard, Lock, DoorOpen, Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event, EventCategory } from '@/types/database';

type EventWithListings = Event & { listingCount: number; lowestPrice: number };

const PHOTO: Record<string, string> = {
  concert:    'photo-1470229722913-7c0e2dbbafd3',
  sports:     'photo-1459865264687-595d652de67e',
  theater:    'photo-1516450360452-9312f5e86fc7',
  festival:   'photo-1533174072545-7a4b6ad7a6c3',
  conference: 'photo-1540575467063-178a50c2df87',
  other:      'photo-1524368535928-5b5e00ddc76b',
};

const FLOW_ICONS = [Tag, CreditCard, Lock, DoorOpen, Wallet];

const FLOW_SCHEME = {
  activeIcon: '#ffffff', activeBorder: '#ffffff', activeBg: 'rgba(26,85,227,0.45)',
  activeGlow: '0 0 16px rgba(255,255,255,0.95), 0 0 36px rgba(255,255,255,0.7), 0 0 60px rgba(120,180,255,0.55)',
  pulse: 'bg-white/70',
  doneIcon: '#5599ff', doneBorder: 'rgba(85,153,255,0.6)', doneBg: 'rgba(26,85,227,0.18)', connector: '#5599ff',
};

export default function Home() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const [query, setQuery]   = useState('');
  const [events, setEvents] = useState<EventWithListings[]>([]);
  const [index, setIndex]   = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const VISIBLE = 4;

  const [flowStep, setFlowStep] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const flowInView = useInView(flowRef, { once: false, margin: '-120px' });

  // Auto-advance the "how it works" flow while it is on screen
  useEffect(() => {
    if (!flowInView) return;
    const id = setInterval(() => setFlowStep((s) => (s + 1) % 6), 1500);
    return () => clearInterval(id);
  }, [flowInView]);

  function scrollCarousel(dir: 'prev' | 'next') {
    const maxIndex = Math.max(0, events.length - VISIBLE);
    setIndex((prev) => {
      if (dir === 'next') return prev >= maxIndex ? 0 : prev + 1;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }

  // Apply the index to the track — RTL-safe (scrollLeft is negative in RTL)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !events.length) return;
    const stride = el.scrollWidth / events.length; // one card + gap
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const target = index * stride;
    el.scrollTo({ left: isRTL ? -target : target, behavior: 'smooth' });
  }, [index, events]);

  // Auto-scroll every 3.5 s
  useEffect(() => {
    if (!events.length) return;
    const id = setInterval(() => scrollCarousel('next'), 3500);
    return () => clearInterval(id);
  }, [events]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/tickets?q=${encodeURIComponent(query.trim())}` : '/tickets');
  }

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }).limit(10),
      supabase.from('listings').select('event_id, asking_price').eq('status', 'active'),
    ]).then(([evR, liR]) => {
      const prices = new Map<string, number[]>();
      for (const l of liR.data || []) {
        if (!prices.has(l.event_id)) prices.set(l.event_id, []);
        prices.get(l.event_id)!.push(l.asking_price);
      }
      const enriched = (evR.data || []).map((e) => {
        const p = prices.get(e.id) || [];
        return { ...e, listingCount: p.length, lowestPrice: p.length ? Math.min(...p) : 0 };
      });
      setEvents(enriched as EventWithListings[]);
    });
  }, []);

  function photoUrl(cat: EventCategory) {
    return `https://images.unsplash.com/${PHOTO[cat] ?? PHOTO.other}?w=700&q=75&auto=format`;
  }

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-20 pt-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22 }}
          className="max-w-4xl text-[2.75rem] font-black text-white sm:text-6xl lg:text-[5.5rem]"
          style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t.home.heroLine1}
        </motion.h1>



        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
          className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60 sm:mt-6 sm:text-2xl"
        >
          {t.home.whySafeSubtitle}
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5 }}
          onSubmit={submitSearch}
          className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/20 bg-white/12 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <Search className="ms-3 h-5 w-5 shrink-0 text-white/40" />
          <input
            type="text"
            placeholder={t.filterBar.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent px-2 py-2.5 text-base text-white placeholder-white/35 focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-[#1a55e3] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#1a55e3]/40 transition hover:bg-[#1548cc]">
            {t.fieldSearch.search}
          </button>
        </motion.form>

        {/* ── FEATURED EVENTS ── */}
        {events.length > 0 && (
          <div className="mt-12 w-full sm:mt-16 md:mt-24 md:px-14">

            {/* Mobile: vertical stack of full-width cards (no carousel) */}
            <div className="mx-auto flex max-w-md flex-col gap-3 md:hidden">
              {events.slice(0, 5).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md"
                >
                  <Link href={`/tickets/${ev.id}`} className="flex items-stretch">
                    <div className="relative h-auto w-28 shrink-0 overflow-hidden">
                      <div className="cover-photo" style={{ backgroundImage: `url(${photoUrl(ev.category)})` }} />
                      <div className="cover-scrim" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-3.5">
                      <span className="mb-1 inline-block w-fit rounded-full bg-[#1a55e3] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                        {t.eventCategory[ev.category] ?? ev.category}
                      </span>
                      <p className="truncate text-sm font-semibold text-white">{ev.title}</p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {new Date(ev.event_date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                        {ev.city && ` · ${ev.city}`}
                      </p>
                      {ev.lowestPrice > 0 && (
                        <p className="mt-1 text-sm font-bold text-[#5599ff]">₪{ev.lowestPrice}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop: 4-up carousel with chevrons */}
            <div className="relative mx-auto hidden max-w-5xl md:block">
            {/* Track — 4 cards visible */}
            <div
              ref={carouselRef}
              className="flex overflow-x-hidden"
              style={{ gap: '1rem' }}
            >
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="flex-none overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md"
                  style={{ width: 'calc((100% - 3rem) / 4)', flexShrink: 0, flexGrow: 0 }}
                >
                  <Link href={`/tickets/${ev.id}`}>
                    <div className="relative h-24 overflow-hidden">
                      <div className="cover-photo" style={{ backgroundImage: `url(${photoUrl(ev.category)})` }} />
                      <div className="cover-scrim" />
                      <span className="absolute bottom-2 start-2 rounded-full bg-[#1a55e3] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-white">
                        {t.eventCategory[ev.category] ?? ev.category}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-semibold text-white">{ev.title}</p>
                      <p className="mt-0.5 text-[0.65rem] text-white/50">
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

            {/* Chevron buttons — sit outside the cards */}
            <button
              type="button"
              onClick={() => scrollCarousel('prev')}
              className="absolute -start-12 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('next')}
              className="absolute -end-12 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      </section>

      {/* ── HOW IT WORKS — simple 5-step flow ── */}
      <div ref={flowRef} className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <h2 className="mb-8 text-center text-2xl font-bold text-white sm:mb-12 sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            {t.home.flowTitle}
          </h2>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-2">
            {FLOW_ICONS.map((Icon, i) => {
              const active = i === flowStep;
              const done = i < flowStep;
              const s = FLOW_SCHEME;
              return (
                <div key={i} className="flex items-center justify-center gap-3 sm:flex-col sm:gap-0">
                  <motion.div
                    animate={{ scale: active ? 1.06 : 1, opacity: active || done ? 1 : 0.85 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-3 text-center sm:w-36"
                  >
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      {/* Smoke halo */}
                      {active && (
                        <motion.span
                          aria-hidden
                          animate={{ scale: [1, 1.25, 1.1, 1.3, 1], opacity: [0.7, 0.95, 0.8, 1, 0.7] }}
                          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                          className="pointer-events-none absolute -inset-5 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(180,210,255,0.45) 40%, transparent 70%)',
                            filter: 'blur(14px)',
                          }}
                        />
                      )}
                      <Icon
                        className="relative h-16 w-16 transition-colors duration-300"
                        strokeWidth={1}
                        style={{
                          color: active ? s.activeIcon : done ? s.doneIcon : 'rgba(255,255,255,0.95)',
                          filter: active
                            ? 'drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 26px rgba(180,210,255,0.5))'
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
                    <p className="mt-3 max-w-[8rem] text-xs font-bold leading-snug text-white">
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
