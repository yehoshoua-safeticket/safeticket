'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Ticket, Shield, Lock, RotateCcw,
  ArrowDown, Music, Trophy, Theater, Sparkles, ChevronRight,
  CircleDollarSign, CheckCircle, X, ChevronDown, ChevronUp,
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

const CATS = [
  { key: 'concert',  label: 'Concerts',  icon: Music },
  { key: 'sports',   label: 'Sports',    icon: Trophy },
  { key: 'theater',  label: 'Theater',   icon: Theater },
  { key: 'festival', label: 'Festivals', icon: Sparkles },
];

const FAQS = [
  { q: 'How does escrow protection work?', a: 'When you buy a ticket, your payment is held by SafeTicket — not the seller. Once you confirm receipt of your tickets, we release the funds. If anything is wrong, you get a full refund.' },
  { q: 'Are sellers verified?', a: 'Yes. Every seller must pass identity verification before listing a single ticket. We also review every listing before it goes live.' },
  { q: 'What if the event is cancelled?', a: 'If an event is officially cancelled, you receive a full refund automatically. No need to chase the seller.' },
  { q: 'How do I receive my tickets?', a: 'Sellers upload digital tickets to the platform. You download them directly after purchase. For physical tickets, a tracked delivery is required.' },
];

export default function VariantA() {
  const { locale } = useLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const [query, setQuery]   = useState('');
  const [events, setEvents] = useState<EventWithListings[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const statsRef  = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').eq('status', 'active').order('event_date', { ascending: true }).limit(8),
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
    return `https://images.unsplash.com/${PHOTO[cat] ?? PHOTO.other}?w=700&q=75&auto=format`;
  }

  return (
    <div dir={dir} style={{ position: 'relative', background: '#09152f' }}>

      {/* Fixed background image */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
      {/* Logo-blue colour-grade overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(140deg, rgba(9,21,47,0.85) 0%, rgba(26,85,227,0.42) 45%, rgba(9,21,47,0.88) 100%)' }} />

      {/* All content — above background and overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/8 bg-black/25 px-6 py-4 backdrop-blur-md sm:px-10">
          <Link href="/preview" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a55e3] to-[#0d1d45] shadow-lg shadow-[#1a55e3]/30">
              <Ticket className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
            <span className="text-[1.1rem] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-white">Safe</span><span className="text-[#5599ff]">Ticket</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {(['Tickets', 'How it works', 'FAQ'] as const).map((l) => (
              <Link key={l} href="/preview" className="rounded-lg px-4 py-2 text-[0.78rem] font-semibold uppercase tracking-wider text-white/50 transition hover:text-white/90">
                {l}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="rounded-full px-5 py-2 text-sm font-medium text-white/70 ring-1 ring-white/15 hover:ring-white/35 transition">
              Sign in
            </Link>
            <Link href="/auth/signup" className="rounded-full bg-[#1a55e3] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#1a55e3]/40 hover:bg-[#1548cc] transition">
              Get started
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-20 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-white/75 backdrop-blur-md"
          >
            <Shield className="h-3 w-3 text-[#5599ff]" strokeWidth={2.5} />
            Israel&apos;s safest ticket marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.22 }}
            className="max-w-4xl text-5xl font-black text-white sm:text-6xl lg:text-[5.5rem]"
            style={{ fontFamily: 'var(--font-display)', lineHeight: 1.0, letterSpacing: '-0.03em' }}
          >
            Buy &amp; Sell<br />
            <span className="text-[#5599ff]">Event Tickets</span><br />
            Safely.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.38 }}
            className="mt-6 max-w-sm text-base leading-relaxed text-white/60"
          >
            Your funds are held in escrow — released only once you have your tickets in hand.
          </motion.p>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5 }}
            onSubmit={(e) => e.preventDefault()}
            className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/20 bg-white/12 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <Search className="ms-3 h-5 w-5 shrink-0 text-white/40" />
            <input
              type="text"
              placeholder="Search artists, teams, events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-2 py-2.5 text-base text-white placeholder-white/35 focus:outline-none"
            />
            <Link
              href={query ? `/tickets?q=${encodeURIComponent(query)}` : '/tickets'}
              className="rounded-xl bg-[#1a55e3] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#1a55e3]/40 transition hover:bg-[#1548cc]"
            >
              Search
            </Link>
          </motion.form>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            {CATS.map(({ key, label, icon: Icon }) => (
              <Link
                key={key}
                href={`/tickets?category=${key}`}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white/65 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/15 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
              <ArrowDown className="h-5 w-5 text-white/30" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── STATS STRIP ── */}
        <div ref={statsRef} className="border-y border-white/10 bg-white/5 py-12 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-6 sm:px-10">
            <div className="grid grid-cols-3 divide-x divide-white/12">
              {[
                { value: '100%', label: 'Money-back guarantee' },
                { value: '< 24h', label: 'Seller verification' },
                { value: '₪0',   label: 'Free to list' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="px-8 text-center first:ps-0 last:pe-0"
                >
                  <div className="text-4xl font-black text-white sm:text-5xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                    {s.value}
                  </div>
                  <div className="mt-2 text-xs font-medium uppercase tracking-wider text-white/45">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EVENTS ── */}
        {events.length > 0 && (
          <div className="py-20">
            <div className="mx-auto max-w-6xl px-6 sm:px-10">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-[#5599ff]">Available now</p>
                  <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                    Events near you
                  </h2>
                </div>
                <Link href="/tickets" className="flex items-center gap-1 text-sm font-semibold text-[#5599ff] transition hover:underline">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="carousel pb-4">
                {events.slice(0, 7).map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="tile-hover w-56 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md"
                  >
                    <Link href={`/tickets/${ev.id}`}>
                      <div className="relative h-36 overflow-hidden">
                        <div className="cover-photo hero-zoom" style={{ backgroundImage: `url(${photoUrl(ev.category)})` }} />
                        <div className="cover-scrim" />
                        <span className="absolute bottom-2.5 start-2.5 rounded-full bg-[#1a55e3] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-white">
                          {ev.category}
                        </span>
                      </div>
                      <div className="p-3.5">
                        <p className="truncate text-sm font-semibold text-white">{ev.title}</p>
                        <p className="mt-0.5 text-[0.7rem] text-white/50">
                          {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {ev.city && ` · ${ev.city}`}
                        </p>
                        {ev.lowestPrice > 0 && (
                          <p className="mt-2 text-sm font-bold text-[#5599ff]">From ₪{ev.lowestPrice}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div className="py-20">
          <div className="mx-auto max-w-5xl px-6 sm:px-10">
            <div className="mb-12 text-center">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[#5599ff]">Zero-risk escrow</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                Your money is protected at every step
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: CircleDollarSign, n: '01', title: 'Pay into escrow',      desc: 'Funds are held by SafeTicket — the seller cannot touch them yet.' },
                { icon: CheckCircle,      n: '02', title: 'Receive your tickets',  desc: 'Seller uploads verified tickets. You download and confirm receipt.' },
                { icon: Shield,           n: '03', title: 'Funds released',        desc: 'Once you confirm, seller gets paid. Something wrong? Full refund.' },
              ].map(({ icon: Icon, n, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md"
                >
                  <span className="mb-3 block text-3xl font-black text-white/10" style={{ fontFamily: 'var(--font-display)' }}>{n}</span>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a55e3]/30">
                    <Icon className="h-5 w-5 text-[#5599ff]" />
                  </div>
                  <h3 className="mb-2 text-[0.95rem] font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRUST FEATURES ── */}
        <div className="border-y border-white/10 bg-white/5 py-16 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-6 sm:px-10">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: Shield,    title: 'Escrow on every order',  desc: 'No ticket — no payment. Funds only release after you confirm.' },
                { icon: Lock,      title: 'Verified sellers only',  desc: 'Every seller passes ID checks. No anonymous listings.' },
                { icon: RotateCcw, title: 'Guaranteed refund',      desc: 'Invalid ticket? Cancelled show? You get your money back, always.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <Icon className="h-5 w-5 text-[#5599ff]" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COMPARISON ── */}
        <div className="py-20">
          <div className="mx-auto max-w-4xl px-6 sm:px-10">
            <div className="mb-12 text-center">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[#5599ff]">Why SafeTicket</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                Not all marketplaces are equal
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Others */}
              <motion.div
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md"
              >
                <p className="mb-5 text-sm font-bold uppercase tracking-wider text-red-400/70">Other marketplaces</p>
                {[
                  'No payment protection',
                  'Unverified sellers',
                  'No refund if ticket is fake',
                  'Hidden service fees',
                  'No escrow — direct transfer',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/6 last:border-0">
                    <X className="h-4 w-4 shrink-0 text-red-400/70" />
                    <span className="text-sm text-white/50">{item}</span>
                  </div>
                ))}
              </motion.div>
              {/* SafeTicket */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-[#1a55e3]/40 bg-[#1a55e3]/10 p-6 backdrop-blur-md"
              >
                <p className="mb-5 text-sm font-bold uppercase tracking-wider text-[#5599ff]">SafeTicket</p>
                {[
                  'Full escrow on every order',
                  'ID-verified sellers only',
                  '100% refund guarantee',
                  'Transparent pricing — no surprises',
                  'Funds released only on confirmation',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/6 last:border-0">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#5599ff]" />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="py-20">
          <div className="mx-auto max-w-3xl px-6 sm:px-10">
            <div className="mb-12 text-center">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[#5599ff]">Questions</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                Frequently asked
              </h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="overflow-hidden rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-start"
                  >
                    <span className="text-sm font-semibold text-white">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="h-4 w-4 shrink-0 text-[#5599ff]" />
                      : <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-white/10 px-6 py-4">
                      <p className="text-sm leading-relaxed text-white/60">{faq.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="py-28 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a55e3]/30 ring-1 ring-[#1a55e3]/40"
            >
              <Ticket className="h-8 w-8 text-[#5599ff]" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            >
              Ready to sell your tickets?
            </motion.h2>
            <p className="mt-4 text-base text-white/60">
              List for free. Get paid the moment your buyer confirms delivery.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup"
                className="rounded-xl bg-white px-9 py-3.5 text-sm font-bold text-[#1a55e3] shadow-lg shadow-black/30 transition hover:bg-white/90"
              >
                Start selling
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-xl border border-white/25 px-9 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:border-white/50 hover:text-white"
              >
                How escrow works
              </Link>
            </div>
          </div>
        </div>

      </div>{/* end content */}

      {/* Preview nav */}
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <Link href="/preview" className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-5 py-2.5 text-xs font-semibold text-white/70 backdrop-blur-xl transition hover:text-white">
          ← All variants
        </Link>
      </div>
    </div>
  );
}
