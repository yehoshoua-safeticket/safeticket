'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Ticket, Shield, Lock, RotateCcw, Music, Trophy, Theater, Sparkles, ArrowRight } from 'lucide-react';
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

const CATS = [
  { key: 'concert', label: 'Concerts', icon: Music },
  { key: 'sports',  label: 'Sports',   icon: Trophy },
  { key: 'theater', label: 'Theater',  icon: Theater },
  { key: 'festival',label: 'Festivals',icon: Sparkles },
];

export default function VariantB() {
  const { locale } = useLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventWithListings[]>([]);

  const heroRef  = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-60px' });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').eq('status', 'active').order('event_date', { ascending: true }).limit(6),
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
      }).filter((e) => e.listingCount > 0);
      setEvents(enriched as EventWithListings[]);
    });
  }, []);

  function photoUrl(cat: EventCategory) {
    return `https://images.unsplash.com/${PHOTO[cat] ?? PHOTO.other}?w=600&q=75&auto=format`;
  }

  return (
    <div dir={dir} className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e8edf7] bg-white/95 px-6 py-4 backdrop-blur-md sm:px-10">
        <Link href="/preview" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0044cc] to-[#062b73]">
            <Ticket className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-[1.05rem] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-[#001e3d]">Safe</span><span className="text-[#0044cc]">Ticket</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {(['Tickets', 'How it works', 'FAQ'] as const).map((l) => (
            <Link key={l} href="/preview" className="rounded-md px-3.5 py-2 text-[0.78rem] font-bold uppercase tracking-wider text-[#4b6482] transition hover:text-[#001e3d]">
              {l}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="rounded-md px-4 py-2 text-[0.78rem] font-bold uppercase tracking-wider text-[#4b6482] hover:text-[#001e3d] transition">
            Sign in
          </Link>
          <Link href="/auth/signup" className="rounded-full bg-[#0044cc] px-5 py-2 text-sm font-bold text-white hover:bg-[#0038aa] transition">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden bg-white px-6 pt-16 pb-0 sm:px-10">
        {/* Giant decorative "100" behind everything */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
          className="pointer-events-none absolute -end-16 top-0 select-none text-[28vw] font-black leading-none text-[#0044cc]/5"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
        >
          100%
        </motion.div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_420px]">
            {/* Left: Headline */}
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d0daf5] bg-[#eef3ff] px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]"
              >
                <Shield className="h-3 w-3" strokeWidth={2.5} />
                100% buyer protection
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl font-black text-[#001e3d] sm:text-6xl lg:text-[4.5rem]"
                style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
              >
                The safest way<br />
                to buy &amp; sell<br />
                <span className="text-[#0044cc]">event tickets.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.34 }}
                className="mt-6 max-w-md text-base leading-relaxed text-[#4b6482]"
              >
                Escrow-backed transactions mean your money is never at risk.
                We verify every seller before a single ticket is listed.
              </motion.p>

              {/* Search */}
              <motion.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.46 }}
                onSubmit={(e) => e.preventDefault()}
                className="mt-8 flex max-w-lg items-center gap-2 rounded-xl border border-[#d0daf5] bg-[#f6f9ff] p-1.5 shadow-sm"
              >
                <Search className="ms-2.5 h-4.5 w-4.5 shrink-0 text-[#4b6482]" />
                <input
                  type="text"
                  placeholder="Search artists, events, venues…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[#001e3d] placeholder-[#8fa4be] focus:outline-none"
                />
                <Link
                  href={query ? `/tickets?q=${encodeURIComponent(query)}` : '/tickets'}
                  className="rounded-lg bg-[#0044cc] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0038aa] transition"
                >
                  Search
                </Link>
              </motion.form>

              {/* Cat chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex flex-wrap gap-2"
              >
                {CATS.map(({ key, label, icon: Icon }) => (
                  <Link
                    key={key}
                    href={`/tickets?category=${key}`}
                    className="flex items-center gap-1.5 rounded-full border border-[#d0daf5] px-3.5 py-1.5 text-xs font-semibold text-[#4b6482] transition hover:border-[#0044cc]/40 hover:text-[#0044cc]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                ))}
              </motion.div>
            </div>

            {/* Right: Photo collage */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Large top-left photo */}
                <div className="relative col-span-2 h-52 overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center hero-zoom"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=80&auto=format)` }}
                  />
                  <div className="absolute inset-0 bg-[#001e3d]/20" />
                </div>
                {/* Two smaller photos */}
                <div className="relative h-36 overflow-hidden rounded-xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center hero-zoom"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=75&auto=format)` }}
                  />
                </div>
                <div className="relative h-36 overflow-hidden rounded-xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center hero-zoom"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=75&auto=format)` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section ref={statsRef} className="mt-16 border-y border-[#e8edf7] bg-[#f8faff] py-10">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-3 divide-x divide-[#e8edf7]">
            {[
              { value: '100%', label: 'Money-back guarantee' },
              { value: '< 24h', label: 'Seller verification' },
              { value: '₪0', label: 'Free to list' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="px-8 text-center"
              >
                <div
                  className="text-4xl font-black text-[#0044cc] sm:text-5xl"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
                >
                  {s.value}
                </div>
                <div className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-[#7a96b2]">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS GRID ── */}
      {events.length > 0 && (
        <section className="bg-white py-20 px-6 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]">On sale now</p>
                <h2 className="text-2xl font-bold text-[#001e3d] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Events near you
                </h2>
              </div>
              <Link href="/tickets" className="flex items-center gap-1 text-sm font-semibold text-[#0044cc] hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="tile-hover overflow-hidden rounded-2xl border border-[#e8edf7] bg-white shadow-sm"
                >
                  <Link href={`/tickets/${ev.id}`}>
                    <div className="relative h-44 overflow-hidden">
                      <div className="cover-photo hero-zoom" style={{ backgroundImage: `url(${photoUrl(ev.category)})` }} />
                      <div className="cover-scrim" />
                      <span className="absolute bottom-3 start-3 rounded-full bg-[#0044cc] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-white">
                        {ev.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-bold text-[#001e3d]">{ev.title}</p>
                      <p className="mt-0.5 text-xs text-[#7a96b2]">
                        {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {ev.city && ` · ${ev.city}`}
                      </p>
                      {ev.lowestPrice > 0 && (
                        <p className="mt-2 text-sm font-bold text-[#0044cc]">From ₪{ev.lowestPrice}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section className="bg-[#f8faff] py-20 px-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-[#001e3d] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              Built around your protection
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield,     n: '01', title: 'Escrow protection',  desc: 'Funds are held securely by SafeTicket until you have your tickets.' },
              { icon: Lock,       n: '02', title: 'Verified sellers',   desc: 'Every seller passes identity checks before they can list anything.' },
              { icon: RotateCcw,  n: '03', title: 'Guaranteed refund',  desc: 'If a ticket is invalid, you receive a full refund — no questions asked.' },
            ].map(({ icon: Icon, n, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-[#e8edf7] bg-white p-6 shadow-sm"
              >
                <span className="mb-4 block text-5xl font-black leading-none text-[#0044cc]/10" style={{ fontFamily: 'var(--font-display)' }}>{n}</span>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ff]">
                  <Icon className="h-5 w-5 text-[#0044cc]" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-[#001e3d]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#4b6482]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 sm:px-10" style={{ background: 'linear-gradient(135deg, #001e3d 0%, #062b73 100%)' }}>
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Ready to get started?
          </motion.h2>
          <p className="mt-4 text-base text-white/60">List tickets for free. Buy with confidence.</p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="rounded-xl bg-[#0044cc] px-9 py-3.5 text-sm font-bold text-white hover:bg-[#0038aa] transition">
              Create an account
            </Link>
            <Link href="/tickets" className="rounded-xl border border-white/20 px-9 py-3.5 text-sm font-semibold text-white/75 hover:border-white/40 hover:text-white transition">
              Browse tickets
            </Link>
          </div>
        </div>
      </section>

      {/* Preview nav */}
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <Link href="/preview" className="flex items-center gap-2 rounded-full border border-[#d0daf5] bg-white/90 px-5 py-2.5 text-xs font-semibold text-[#4b6482] shadow-lg backdrop-blur-xl transition hover:text-[#001e3d]">
          ← All variants
        </Link>
      </div>
    </div>
  );
}
