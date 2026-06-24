'use client';

import { motion, useInView, AnimatePresence } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket, Shield, Lock, CheckCircle, CircleDollarSign,
  ArrowRight, Music, Trophy, Theater, Sparkles, ChevronRight,
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

// Escrow flow steps — animated one-by-one
const FLOW_STEPS = [
  { icon: CircleDollarSign, label: 'Buyer pays',           sub: 'Funds enter escrow' },
  { icon: Shield,           label: 'SafeTicket holds',     sub: 'Seller cannot access funds' },
  { icon: Ticket,           label: 'Tickets delivered',    sub: 'Digital transfer verified' },
  { icon: CheckCircle,      label: 'Buyer confirms',       sub: 'You verify receipt' },
  { icon: Lock,             label: 'Seller gets paid',     sub: 'Funds released instantly' },
];

export default function VariantC() {
  const { locale } = useLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const [events, setEvents] = useState<EventWithListings[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const flowRef = useRef<HTMLDivElement>(null);
  const flowInView = useInView(flowRef, { once: true, margin: '-100px' });

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

  // Auto-advance escrow flow animation
  useEffect(() => {
    if (!flowInView) return;
    const id = setInterval(() => setActiveStep((s) => (s + 1) % FLOW_STEPS.length), 1600);
    return () => clearInterval(id);
  }, [flowInView]);

  function photoUrl(cat: EventCategory) {
    return `https://images.unsplash.com/${PHOTO[cat] ?? PHOTO.other}?w=600&q=75&auto=format`;
  }

  return (
    <div dir={dir} className="min-h-screen bg-white">

      {/* ── HERO: SPLIT LAYOUT ── */}
      <section className="grid min-h-screen lg:grid-cols-[520px_1fr]">

        {/* Left — dark navy panel */}
        <div className="relative flex flex-col justify-between bg-[#001020] px-8 py-10 sm:px-12 lg:px-14">
          {/* Gradient bleed */}
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 70%, #0044cc, transparent)' }} />

          {/* Nav logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0044cc] to-[#062b73] shadow-lg shadow-[#0044cc]/30">
              <Ticket className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
            <span className="text-[1.1rem] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-white">Safe</span><span className="text-[#4d94ff]">Ticket</span>
            </span>
          </div>

          {/* Headline block */}
          <div className="relative z-10 py-10">
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-white/70"
            >
              <Shield className="h-3 w-3 text-[#4d94ff]" strokeWidth={2.5} />
              Escrow-backed marketplace
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-black text-white sm:text-5xl lg:text-[3.4rem]"
              style={{ fontFamily: 'var(--font-display)', lineHeight: 1.06, letterSpacing: '-0.03em' }}
            >
              Tickets bought.<br />
              <span className="text-[#4d94ff]">Money protected.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              className="mt-5 max-w-xs text-base leading-relaxed text-white/55"
            >
              We hold your payment in escrow from the moment you click &quot;Buy&quot; until your tickets arrive.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/tickets"
                className="rounded-xl bg-[#0044cc] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0044cc]/35 transition hover:bg-[#0038aa]"
              >
                Browse tickets
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Sell tickets
              </Link>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 grid grid-cols-3 gap-3"
          >
            {[
              { icon: Shield,      label: 'Escrow protected' },
              { icon: Lock,        label: 'Verified sellers' },
              { icon: CheckCircle, label: '100% refund guarantee' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
                <Icon className="mx-auto mb-1.5 h-4 w-4 text-[#4d94ff]" />
                <p className="text-[0.62rem] font-semibold leading-tight text-white/55">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — product demo panel */}
        <div className="flex flex-col items-center justify-center bg-[#f4f7fd] px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Browser chrome */}
            <div className="overflow-hidden rounded-2xl border border-[#d8e3f4] shadow-xl shadow-[#0044cc]/8">
              <div className="flex items-center gap-1.5 border-b border-[#e8edf7] bg-[#f0f4ff] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                <div className="ms-2 flex-1 rounded-md bg-white border border-[#e8edf7] px-3 py-1 text-[0.65rem] text-[#8fa4be]">
                  safeticket.co.il/tickets/...
                </div>
              </div>

              {/* Mock ticket card */}
              <div className="bg-white p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#0044cc]">Concert · Tel Aviv</p>
                    <p className="mt-0.5 text-lg font-bold text-[#001e3d]">Coldplay – Music of the Spheres</p>
                    <p className="mt-0.5 text-xs text-[#7a96b2]">Yarkon Park · 14 Nov 2025</p>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[0.65rem] font-bold text-[#16a34a]">Verified ✓</span>
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e8edf7] bg-[#f8faff] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef3ff]">
                    <Ticket className="h-5 w-5 text-[#0044cc]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#001e3d]">2× Floor tickets · Section A</p>
                    <p className="text-[0.68rem] text-[#7a96b2]">Seller verified · Risk: Clear</p>
                  </div>
                  <p className="text-base font-black text-[#0044cc]">₪890</p>
                </div>

                {/* Escrow status */}
                <div ref={flowRef} className="space-y-2">
                  <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-[#7a96b2]">Escrow status</p>
                  {FLOW_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                      <motion.div
                        key={i}
                        animate={{ opacity: done || active ? 1 : 0.3 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${done ? 'bg-[#dcfce7]' : active ? 'bg-[#eef3ff]' : 'bg-[#f0f4ff]'}`}>
                          <Icon className={`h-3.5 w-3.5 ${done ? 'text-[#16a34a]' : active ? 'text-[#0044cc]' : 'text-[#bfcfe8]'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${done || active ? 'text-[#001e3d]' : 'text-[#bfcfe8]'}`}>{step.label}</p>
                          <p className="text-[0.65rem] text-[#9ab0c8]">{step.sub}</p>
                        </div>
                        <AnimatePresence>
                          {done && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="h-4 w-4 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[0.5rem]"
                            >
                              ✓
                            </motion.div>
                          )}
                          {active && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="h-4 w-4 rounded-full border-2 border-[#0044cc] border-t-transparent animate-spin"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Buy button */}
                <button className="mt-5 w-full rounded-xl bg-[#0044cc] py-3 text-sm font-bold text-white shadow hover:bg-[#0038aa] transition">
                  Buy — ₪890 (escrow protected)
                </button>
              </div>
            </div>

            <p className="mt-3 text-center text-[0.68rem] text-[#9ab0c8]">
              Your payment is held safely until you confirm receipt
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <section className="bg-white py-20 px-6 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#0044cc]">Available now</p>
                <h2 className="text-2xl font-bold text-[#001e3d] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Events near you
                </h2>
              </div>
              <Link href="/tickets" className="flex items-center gap-1 text-sm font-semibold text-[#0044cc] hover:underline">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
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

      {/* ── CTA ── */}
      <section className="py-24 px-6 sm:px-10" style={{ background: 'linear-gradient(135deg, #001020 0%, #062b73 100%)' }}>
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Sell your tickets safely.
          </motion.h2>
          <p className="mt-4 text-base text-white/55">
            List for free. Buyers pay into escrow. You get paid on delivery.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="rounded-xl bg-[#0044cc] px-9 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0044cc]/30 hover:bg-[#0038aa] transition">
              Start selling
            </Link>
            <Link href="/how-it-works" className="flex items-center gap-1.5 rounded-xl border border-white/20 px-9 py-3.5 text-sm font-semibold text-white/75 hover:border-white/40 hover:text-white transition">
              How it works <ArrowRight className="h-4 w-4" />
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
