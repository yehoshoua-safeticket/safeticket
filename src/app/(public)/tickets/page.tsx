'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FilterBar from '@/components/tickets/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import FadeIn from '@/components/ui/FadeIn';
import EventCover from '@/components/ui/EventCover';
import { createClient } from '@/lib/supabase';
import { Ticket, MapPin, Calendar } from 'lucide-react';
import type { Event, EventCategory } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';
import { inDateRange } from '@/lib/filters';

type EventWithListings = Event & { listingCount: number; lowestPrice: number };

function TicketsInner() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';
  const params = useSearchParams();
  const [allEvents, setAllEvents] = useState<EventWithListings[]>([]);

  // All filters live in the URL — set by the global search strip (q / city /
  // date) and the FilterBar "סינון" panel (category / price / sort).
  const search = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const category = params.get('category') ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const dateFrom = params.get('dateFrom') ?? '';
  const dateTo = params.get('dateTo') ?? '';
  const sort = params.get('sort') ?? '';

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('listings').select('event_id, asking_price').eq('status', 'active'),
    ]).then(([eventsRes, listingsRes]) => {
      const prices = new Map<string, number[]>();
      for (const l of listingsRes.data || []) {
        if (!prices.has(l.event_id)) prices.set(l.event_id, []);
        prices.get(l.event_id)!.push(l.asking_price);
      }
      const enriched = (eventsRes.data || [] as Event[]).map((e) => {
        const p = prices.get(e.id) || [];
        return { ...e, listingCount: p.length, lowestPrice: p.length > 0 ? Math.min(...p) : 0 };
      // Hide events still awaiting admin validation (missing status = pre-migration = treat as active).
      }).filter((e) => e.listingCount > 0 && (e.status === undefined || e.status === 'active'));
      setAllEvents(enriched as EventWithListings[]);
    });
  }, []);

  const filteredEvents = useMemo(() => {
    const list = allEvents.filter((event) => {
      if (search) {
        const q = search.toLowerCase();
        if (!event.title.toLowerCase().includes(q) && !event.venue.toLowerCase().includes(q) && !event.city.toLowerCase().includes(q)) return false;
      }
      if (city && event.city !== city) return false;
      if (category && event.category !== category) return false;
      if (minPrice && event.lowestPrice < parseFloat(minPrice)) return false;
      if (maxPrice && event.lowestPrice > parseFloat(maxPrice)) return false;
      if ((dateFrom || dateTo) && !inDateRange(event.event_date, dateFrom, dateTo)) return false;
      return true;
    });
    if (sort === 'priceLow') return [...list].sort((a, b) => a.lowestPrice - b.lowestPrice);
    if (sort === 'priceHigh') return [...list].sort((a, b) => b.lowestPrice - a.lowestPrice);
    return list; // default: by event date (already ordered from the query)
  }, [allEvents, search, city, category, minPrice, maxPrice, dateFrom, dateTo, sort]);

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'concert': return t.eventCategory.concert;
      case 'sports': return t.eventCategory.sports;
      case 'theater': return t.eventCategory.theater;
      case 'festival': return t.eventCategory.festival;
      case 'conference': return t.eventCategory.conference;
      default: return t.eventCategory.other;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t.tickets.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.tickets.subtitle}</p>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <FilterBar />
        <div className="mt-5 text-sm text-[var(--muted)]">{t.tickets.count.replace('{n}', String(filteredEvents.length))}</div>
      </FadeIn>
      {filteredEvents.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, i) => (
            <FadeIn key={event.id} delay={i * 0.06}>
              <Link href={`/tickets/${event.id}`} className="group block overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/8">
                <EventCover category={event.category as EventCategory} title={event.title} imageUrl={event.image_url} size="md" className="transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="p-5">
                  <div className="mb-2 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                    {categoryLabel(event.category)}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-text)]">{event.title}</h3>
                  <div className="space-y-1 text-sm text-[var(--muted)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{event.venue}, {event.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(event.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-3">
                    <span className="text-sm text-[var(--muted)]">{t.tickets.ticketsCount.replace('{n}', String(event.listingCount))}</span>
                    <span className="font-semibold text-[var(--accent-text)]">{t.tickets.fromPrice.replace('{price}', String(event.lowestPrice))}</span>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      ) : (
        <FadeIn>
          <div className="mt-8"><EmptyState icon={Ticket} title={t.tickets.emptyTitle} description={t.tickets.emptyDesc} /></div>
        </FadeIn>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-8 sm:px-8" />}>
      <TicketsInner />
    </Suspense>
  );
}
