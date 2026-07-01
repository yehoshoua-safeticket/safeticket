'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Tag, CreditCard, ArrowRight, Shield, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import FadeIn from '@/components/ui/FadeIn';
import EventCover from '@/components/ui/EventCover';
import type { Event, Listing, EventCategory } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

// Fisher–Yates shuffle — tickets on the event page are shown in random order
// so no single seller is consistently favoured by position.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function EventDetailPage() {
  const params = useParams();
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';
  const [event, setEvent] = useState<Event | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('listings').select('*, seller:profiles(*)').eq('event_id', id).eq('status', 'active'),
    ]).then(([eventRes, listingsRes]) => {
      setEvent(eventRes.data as Event | null);
      setListings(shuffle((listingsRes.data || []) as Listing[]));
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t.ticketDetail.notFoundTitle}</h1>
        <p className="mt-2 text-[var(--muted)]">{t.ticketDetail.notFoundDesc}</p>
        <Link href="/tickets" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white">{t.ticketDetail.notFoundBack}</Link>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const catMap: Record<string, string> = { concert: t.eventCategory.concert, sports: t.eventCategory.sports, theater: t.eventCategory.theater, festival: t.eventCategory.festival, conference: t.eventCategory.conference };
  const categoryLabel = catMap[event.category] ?? t.eventCategory.other;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <FadeIn>
        <Link href="/tickets" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />{t.ticketDetail.back}
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="mb-8 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <EventCover category={event.category as EventCategory} title={event.title} imageUrl={event.image_url} size="lg" />
          <div className="p-6">
            <div className="mb-3 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-text)]">
              {categoryLabel}
            </div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{eventDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {eventDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{event.venue}, {event.city}</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-semibold">{t.ticketDetail.whySafe}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t.ticketDetail.trustVerified, desc: t.ticketDetail.trustVerifiedDesc },
              { icon: Shield, title: t.ticketDetail.trustPayment, desc: t.ticketDetail.trustPaymentDesc },
              { icon: Clock, title: t.ticketDetail.trustRefund, desc: t.ticketDetail.trustRefundDesc },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-4 w-4 text-[var(--accent-text)]" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <h2 className="mb-4 text-lg font-semibold">{t.ticketDetail.availableCount.replace('{n}', String(listings.length))}</h2>
      </FadeIn>

      {listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing, i) => {
            const serviceFee = Math.round(listing.asking_price * listing.quantity * 0.10);
            const total = listing.asking_price * listing.quantity + serviceFee;
            const discount = listing.face_value > listing.asking_price
              ? Math.round(((listing.face_value - listing.asking_price) / listing.face_value) * 100)
              : 0;

            return (
              <FadeIn key={listing.id} delay={0.25 + i * 0.06}>
                <div className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all duration-200 hover:border-[var(--accent)]/30 hover:shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {listing.section && (
                          <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                            <Tag className="h-3.5 w-3.5" />
                            <span>{t.ticketDetail.sectionLabel.replace('{s}', listing.section)}</span>
                          </div>
                        )}
                        {listing.row && <span className="text-sm text-[var(--muted)]">{t.ticketDetail.rowLabel.replace('{r}', listing.row)}</span>}
                        {listing.seat_info && <span className="text-sm text-[var(--muted)]">· {listing.seat_info}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-[var(--muted)]">{t.tickets.ticketsCount.replace('{n}', String(listing.quantity))}</span>
                        {discount > 0 && (
                          <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                            {t.ticketDetail.discount.replace('{n}', String(discount))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-end">
                        <div className="text-xl font-bold">₪{listing.asking_price}</div>
                        <div className="text-xs text-[var(--muted)]">{t.ticketDetail.perTicket}</div>
                        {listing.quantity > 1 && (
                          <div className="text-xs text-[var(--muted)]">{t.ticketDetail.total.replace('{total}', String(total))}</div>
                        )}
                      </div>
                      <Link
                        href={`/checkout?listingId=${listing.id}`}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[var(--accent)]/20 transition-all hover:shadow-lg hover:shadow-[var(--accent)]/30 hover:brightness-110"
                      >
                        <CreditCard className="h-4 w-4" />
                        {t.ticketDetail.buyNow}
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      ) : (
        <FadeIn delay={0.25}>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted)]">{t.ticketDetail.noListings}</p>
            <Link href="/tickets" className="mt-4 inline-block text-sm font-medium text-[var(--accent-text)]">{t.ticketDetail.searchOther}</Link>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
