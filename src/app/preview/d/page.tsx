'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Shield, Lock, CheckCircle, ArrowRight, Star, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event } from '@/types/database';

type EventWithListings = Event & { listingCount: number; lowestPrice: number };

const STUBS = [
  { x: '8%',  y: '18%', rot: -12, delay: 0.2, scale: 0.9  },
  { x: '78%', y: '12%', rot:  8,  delay: 0.5, scale: 1.0  },
  { x: '85%', y: '58%', rot: -6,  delay: 0.1, scale: 0.85 },
  { x: '5%',  y: '62%', rot:  14, delay: 0.4, scale: 0.8  },
  { x: '50%', y: '82%', rot: -4,  delay: 0.6, scale: 0.75 },
];

function TicketStub({ x, y, rot, delay, scale }: typeof STUBS[0]) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', left: x, top: y }}
      className="pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [rot, rot + 2, rot] }}
        transition={{ duration: 5 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-xl border border-[#0044cc]/12 bg-white px-4 py-2.5"
        style={{ boxShadow: '0 4px 24px rgba(0,68,204,0.10), 0 1px 4px rgba(0,68,204,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Ticket className="h-3.5 w-3.5 text-[#0044cc]" />
          <span className="text-[0.62rem] font-bold tracking-wider text-[#4b6482] uppercase">
            {['Concert', 'Sports', 'Festival', 'Theater', 'Live'][Math.floor((delay * 7) % 5)]}
          </span>
        </div>
        <div className="mt-1 text-xs font-black text-[#001e3d]/30" style={{ fontFamily: 'var(--font-display)' }}>
          ₪{Math.floor(150 + delay * 200)}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VariantD() {
  const { locale } = useLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const [events, setEvents] = useState<EventWithListings[]>([]);

  const statsRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-60px' });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').eq('status', 'active').order('event_date', { ascending: true }).limit(4),
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

  return (
    <div
      dir={dir}
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #eef4ff 0%, #ffffff 45%, #f3f0ff 100%)' }}
    >

      {/* ── ANIMATED MESH BACKGROUND ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Subtle blueprint grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,68,204,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,68,204,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Primary blue wash — top */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.75, 0.55] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full"
          style={{
            width: '65vw',
            height: '55vw',
            top: '-22vw',
            left: '18vw',
            background: 'radial-gradient(circle, rgba(0,68,204,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Secondary — bottom right */}
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute rounded-full"
          style={{
            width: '45vw',
            height: '45vw',
            bottom: '-12vw',
            right: '2vw',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }}
        />
        {/* Accent — mid right */}
        <motion.div
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute rounded-full"
          style={{
            width: '28vw',
            height: '28vw',
            top: '38%',
            left: '62%',
            background: 'radial-gradient(circle, rgba(0,68,204,0.05) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e8edf7]/60 bg-white/80 px-6 py-4 backdrop-blur-md sm:px-12">
        <Link href="/preview" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0044cc] to-[#062b73] shadow-md shadow-[#0044cc]/25">
            <Ticket className="h-5 w-5 text-white" strokeWidth={2} />
          </span>
          <span className="text-[1.1rem] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-[#001e3d]">Safe</span><span className="text-[#0044cc]">Ticket</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {(['Tickets', 'How it works', 'FAQ'] as const).map((l) => (
            <Link key={l} href="/preview" className="rounded-lg px-4 py-2 text-[0.78rem] font-semibold uppercase tracking-wider text-[#4b6482] transition hover:text-[#001e3d]">
              {l}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="rounded-full px-5 py-2 text-sm font-medium text-[#4b6482] ring-1 ring-[#d0daf5] transition hover:ring-[#0044cc]/30 hover:text-[#001e3d]">
            Sign in
          </Link>
          <Link href="/auth/signup" className="rounded-full bg-[#0044cc] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#0044cc]/25 hover:bg-[#0038aa] transition">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Floating ticket stubs */}
        {STUBS.map((s, i) => <TicketStub key={i} {...s} />)}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="relative z-10 mb-7 inline-flex items-center gap-2 rounded-full border border-[#0044cc]/20 bg-[#eef3ff] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]"
        >
          <Star className="h-3 w-3" strokeWidth={2.5} />
          Israel&apos;s #1 secure ticket exchange
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-4xl text-5xl font-black sm:text-6xl lg:text-[5.5rem]"
          style={{
            fontFamily: 'var(--font-display)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #001e3d 0%, #0038aa 55%, #4d94ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Never lose a<br />single shekel<br />on tickets.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="relative z-10 mt-6 max-w-md text-base leading-relaxed text-[#4b6482]"
        >
          Escrow-backed transactions protect every purchase. The seller gets paid only after you confirm your tickets.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.56 }}
          className="relative z-10 mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/tickets"
            className="group flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #0044cc, #062b73)',
              boxShadow: '0 4px 24px rgba(0,68,204,0.30), 0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            Browse tickets
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl border border-[#d0daf5] px-8 py-3.5 text-sm font-semibold text-[#4b6482] transition hover:border-[#0044cc]/30 hover:text-[#001e3d]"
          >
            Sell tickets
          </Link>
        </motion.div>

        {/* Glowing divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 h-px w-full max-w-3xl origin-center"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,68,204,0.25), transparent)' }}
        />
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="relative py-16">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-3 divide-x divide-[#e2eaf8]">
            {[
              { value: '100%', label: 'Buyer guarantee' },
              { value: '< 24h', label: 'Seller verification' },
              { value: '₪0', label: 'Listing fee' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="px-8 text-center"
              >
                <div
                  className="text-4xl font-black sm:text-5xl"
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #001e3d, #0044cc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.value}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#9ab0c8]">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-20 px-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]">Zero-risk escrow</p>
            <h2
              className="text-2xl font-bold text-[#001e3d] sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your money is protected at every step
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Shield,      title: 'Pay into escrow',      desc: 'Funds are held by SafeTicket. The seller sees a pending balance — nothing more.' },
              { icon: Ticket,      title: 'Receive your tickets',  desc: 'The seller uploads verified tickets to the platform. You get access immediately.' },
              { icon: CheckCircle, title: 'Confirm & release',     desc: 'You confirm receipt. Funds release to the seller. If anything is wrong — full refund.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm transition hover:border-[#0044cc]/25 hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(0,68,204,0.05)' }}
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,68,204,0.10), rgba(6,43,115,0.08))',
                    boxShadow: '0 0 16px rgba(0,68,204,0.10)',
                  }}
                >
                  <Icon className="h-6 w-6 text-[#0044cc]" />
                </div>
                <h3 className="mb-2 text-[0.95rem] font-bold text-[#001e3d]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#4b6482]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <section className="relative py-20 px-6 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]">Live listings</p>
                <h2 className="text-2xl font-bold text-[#001e3d] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Events near you
                </h2>
              </div>
              <Link href="/tickets" className="flex items-center gap-1 text-sm font-semibold text-[#0044cc] hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group rounded-xl border border-[#e2eaf8] bg-white p-4 shadow-sm transition hover:border-[#0044cc]/25 hover:shadow-md"
                >
                  <Link href={`/tickets/${ev.id}`}>
                    <span className="mb-2 inline-block rounded-full border border-[#0044cc]/20 bg-[#eef3ff] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#0044cc]">
                      {ev.category}
                    </span>
                    <p className="mb-0.5 line-clamp-2 text-sm font-bold text-[#001e3d] leading-tight">{ev.title}</p>
                    <p className="text-[0.68rem] text-[#9ab0c8]">
                      {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {ev.city && ` · ${ev.city}`}
                    </p>
                    {ev.lowestPrice > 0 && (
                      <p className="mt-2 text-sm font-black text-[#0044cc]">From ₪{ev.lowestPrice}</p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA — dark bookend ── */}
      <section className="relative overflow-hidden py-28 px-6 sm:px-10 text-center" style={{ background: 'linear-gradient(135deg, #001e3d 0%, #062b73 100%)' }}>
        {/* Glow inside dark CTA */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto h-64 w-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,68,204,0.35) 0%, transparent 70%)', filter: 'blur(55px)' }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-white/70"
          >
            <Zap className="h-3 w-3" strokeWidth={2.5} />
            List in under 2 minutes
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Ready to sell your tickets?
          </motion.h2>
          <p className="mt-4 text-base text-white/55">
            Free to list. Buyers pay into escrow. You get paid on confirmed delivery.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-white px-9 py-3.5 text-sm font-bold text-[#0044cc] shadow-lg shadow-black/20 hover:bg-white/90 transition"
            >
              Create free account
            </Link>
            <Link
              href="/tickets"
              className="rounded-xl border border-white/20 px-9 py-3.5 text-sm font-semibold text-white/65 transition hover:border-white/35 hover:text-white"
            >
              Browse tickets first
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
