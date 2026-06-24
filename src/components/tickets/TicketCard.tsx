'use client';

import Link from 'next/link';
import { Calendar, MapPin, ShieldCheck } from 'lucide-react';
import type { Listing } from '@/types/database';

interface TicketCardProps {
  listing: Listing;
  showStatus?: boolean;
}

export default function TicketCard({ listing, showStatus = false }: TicketCardProps) {
  const event = listing.event;
  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  const formattedTime = eventDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const discount = listing.face_value > listing.asking_price
    ? Math.round(((listing.face_value - listing.asking_price) / listing.face_value) * 100)
    : 0;

  return (
    <Link href={`/tickets/${listing.event_id}`} className="group block">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-all hover:shadow-sm hover:shadow-black/5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-[0.95rem] font-semibold leading-snug group-hover:text-[var(--accent-text)]">
            {event.title}
          </h3>
          {discount > 0 && (
            <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-text)]">
              -{discount}%
            </span>
          )}
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate} · {formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{event.venue}, {event.city}</span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-[var(--card-border)] pt-4">
          <div>
            <span className="text-xl font-bold">₪{listing.asking_price}</span>
            {discount > 0 && (
              <span className="me-1.5 text-sm text-[var(--muted)] line-through">₪{listing.face_value}</span>
            )}
            <div className="mt-0.5 text-xs text-[var(--muted)]">{listing.quantity} כרטיסים</div>
          </div>
          <div className="flex items-center gap-1 text-[var(--accent-text)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs">מאומת</span>
          </div>
        </div>

        {showStatus && (
          <div className="mt-3 text-xs text-[var(--muted)]">סטטוס: {listing.status}</div>
        )}
      </div>
    </Link>
  );
}
