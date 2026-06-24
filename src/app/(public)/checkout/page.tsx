'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, CreditCard, Check, ArrowRight, Download, Info, User, Mail, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Listing, Event } from '@/types/database';

function CheckoutInner() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const [listing, setListing] = useState<Listing | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        setBuyerEmail(user.email ?? '');
        const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
        if (profile) {
          setBuyerName(profile.full_name ?? '');
          setBuyerPhone(profile.phone ?? '');
        }
      }
      setAuthResolved(true);
    });

    if (!listingId) { setLoading(false); return; }
    supabase
      .from('listings')
      .select('*, event:events(*)')
      .eq('id', listingId)
      .single()
      .then(({ data }) => {
        if (data) {
          const { event: eventData, ...listingData } = data as Listing & { event: Event };
          setListing(listingData as Listing);
          setEvent(eventData as Event);
        }
        setLoading(false);
      });
  }, [listingId]);

  async function handlePay() {
    setPaying(true);
    setPayError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || t.checkout.genericError);
        setPaying(false);
        return;
      }
      setOrderNumber(`#ORD-${String(data.orderId).slice(0, 8).toUpperCase()}`);
      setStep('success');
    } catch {
      setPayError(t.checkout.genericError);
    } finally {
      setPaying(false);
    }
  }

  if (loading || !authResolved) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!listing || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.checkout.notFoundTitle}</h1>
        <p className="mt-2 text-[var(--muted)]">{t.checkout.notFoundDesc}</p>
        <Link href="/tickets" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white">
          {t.checkout.backToTickets}
        </Link>
      </div>
    );
  }

  if (!userId) {
    const next = encodeURIComponent(`/checkout?listingId=${listingId}`);
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.checkout.loginRequiredTitle}</h1>
        <p className="mt-2 text-[var(--muted)]">{t.checkout.loginRequiredDesc}</p>
        <Link href={`/auth/login?next=${next}`} className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white">
          {t.checkout.loginButton}
        </Link>
      </div>
    );
  }

  const serviceFee = Math.round(listing.asking_price * listing.quantity * 0.10);
  const total = listing.asking_price * listing.quantity + serviceFee;

  if (step === 'success') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-10 w-10 text-[var(--accent-text)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.checkout.successTitle}</h1>
        <p className="mt-4 text-[var(--muted)]">{t.checkout.successDesc}</p>
        <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">{t.checkout.orderNumber}</span>
              <span className="font-mono text-[var(--foreground)]">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">{t.checkout.event}</span>
              <span className="text-[var(--foreground)]">{event.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">{t.checkout.statusLabel}</span>
              <span className="text-[var(--accent-text)]">{t.checkout.statusHeld}</span>
            </div>
          </div>
        </div>
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 font-semibold text-white transition hover:opacity-90">
          <Download className="h-5 w-5" />
          {t.checkout.downloadTicket}
        </button>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/dashboard/buyer" className="rounded-xl border border-[var(--input-border)] px-6 py-3 text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">
            {t.checkout.viewOrders}
          </Link>
          <Link href="/tickets" className="rounded-xl border border-[var(--input-border)] px-6 py-3 text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">
            {t.checkout.backToTickets}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Link href="/tickets" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {t.checkout.backToTickets}
        </Link>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.checkout.title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.checkout.ticketDetails}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.event}</span>
                <span className="text-[var(--foreground)]">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.venue}</span>
                <span className="text-[var(--foreground)]">{event.venue}, {event.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.date}</span>
                <span className="text-[var(--foreground)]">
                  {new Date(event.event_date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {listing.seat_info && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t.checkout.seats}</span>
                  <span className="text-[var(--foreground)]">{listing.seat_info}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.quantity}</span>
                <span className="text-[var(--foreground)]">{t.checkout.ticketsCount.replace('{n}', String(listing.quantity))}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.checkout.buyerDetails}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <User className="h-4 w-4" />{t.checkout.fullName}
                </label>
                <input type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder={t.checkout.fullNamePlaceholder} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Mail className="h-4 w-4" />{t.checkout.email}
                </label>
                <input type="email" required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Phone className="h-4 w-4" />{t.checkout.phone}
                </label>
                <input type="tel" required value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="050-1234567" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{t.checkout.deliveryNote}</p>
          </div>

          {step === 'payment' && (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.checkout.paymentDetails}</h2>
              <p className="mb-4 text-sm text-[var(--muted)]">{t.checkout.paymentPlaceholder}</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.checkout.cardNumber}</label>
                  <input type="text" placeholder="4242 4242 4242 4242" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.checkout.expiry}</label>
                    <input type="text" placeholder="MM/YY" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.checkout.cvv}</label>
                    <input type="text" placeholder="123" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                <Lock className="h-3 w-3" />
                <span>{t.checkout.sslNote}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
            <div className="text-sm text-[var(--accent-text)]">
              <p className="font-semibold">{t.checkout.protectionTitle}</p>
              <p className="mt-0.5 text-[var(--accent-text)]/80">{t.checkout.protectionDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 px-1 text-xs text-[var(--muted)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{t.checkout.consumerNote}</p>
          </div>
        </div>

        <div>
          <div className="sticky top-24 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.checkout.summary}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.ticketLine.replace('{n}', String(listing.quantity))}</span>
                <span className="text-[var(--foreground)]">₪{listing.asking_price * listing.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.checkout.serviceFee}</span>
                <span className="text-[var(--foreground)]">₪{serviceFee}</span>
              </div>
              <div className="border-t border-[var(--card-border)] pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-[var(--foreground)]">{t.checkout.total}</span>
                  <span className="text-xl font-bold text-[var(--foreground)]">₪{total}</span>
                </div>
              </div>
            </div>

            {payError && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{payError}</div>
            )}

            {step === 'review' ? (
              <button onClick={() => setStep('payment')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:opacity-90">
                <CreditCard className="h-5 w-5" />
                {t.checkout.continueToPayment}
              </button>
            ) : (
              <button onClick={handlePay} disabled={paying} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
                {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                {paying ? t.checkout.processing : t.checkout.payAmount.replace('{amount}', String(total))}
              </button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <Lock className="h-3 w-3" />
              <span>{t.checkout.securePayment}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
