'use client';

import { Music, Trophy, Theater, Sparkles, Ticket, Mic2 } from 'lucide-react';
import type { EventCategory } from '@/types/database';

interface EventCoverProps {
  category: EventCategory;
  title: string;
  imageUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Bright, sunny, colour-forward photo per category (sports = green football pitch).
const categoryConfig: Record<string, { icon: typeof Music; word: string; photo: string }> = {
  concert:    { icon: Music,    word: 'CONCERT',    photo: 'photo-1514525253161-7a46d19cd819' },
  sports:     { icon: Trophy,   word: 'SPORTS',     photo: 'photo-1551958219-acbc608c6377' },
  theater:    { icon: Theater,  word: 'THEATER',    photo: 'photo-1580809361436-42a7ec204889' },
  festival:   { icon: Sparkles, word: 'FESTIVAL',   photo: 'photo-1506157786151-b8491531f063' },
  conference: { icon: Mic2,     word: 'CONFERENCE', photo: 'photo-1515187029135-18ee286d815b' },
  other:      { icon: Ticket,   word: 'LIVE',       photo: 'photo-1523580494863-6f3031224c94' },
};

export default function EventCover({ category, title, imageUrl, className = '', size = 'md' }: EventCoverProps) {
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;
  const sizeClasses = { sm: 'h-40', md: 'h-48', lg: 'h-72' };
  // Prefer the event's own picture; fall back to the category photo.
  const photoUrl = imageUrl || `https://images.unsplash.com/${config.photo}?w=900&q=72&auto=format`;

  return (
    <div className={`relative overflow-hidden bg-[var(--surface-2)] ${sizeClasses[size]} ${className}`} role="img" aria-label={`${config.word} — ${title}`}>
      <div className="cover-photo" style={{ backgroundImage: `url(${photoUrl})` }} />
      <div className="cover-scrim" />
      {/* category pill */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white">
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          {config.word}
        </span>
      </div>
    </div>
  );
}
