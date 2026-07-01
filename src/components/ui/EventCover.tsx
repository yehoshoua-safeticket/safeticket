'use client';

import { Music, Trophy, Theater, Sparkles, Ticket, Mic2 } from 'lucide-react';
import type { EventCategory } from '@/types/database';

interface EventCoverProps {
  category: EventCategory;
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Vivid, colour-forward photo per category (e.g. sports = green stadium pitch).
const categoryConfig: Record<string, { icon: typeof Music; word: string; photo: string }> = {
  concert:    { icon: Music,    word: 'CONCERT',    photo: 'photo-1493225457124-a3eb161ffa5f' },
  sports:     { icon: Trophy,   word: 'SPORTS',     photo: 'photo-1522778119026-d647f0596c20' },
  theater:    { icon: Theater,  word: 'THEATER',    photo: 'photo-1503095396549-807759245b35' },
  festival:   { icon: Sparkles, word: 'FESTIVAL',   photo: 'photo-1470225620780-dba8ba36b745' },
  conference: { icon: Mic2,     word: 'CONFERENCE', photo: 'photo-1540575467063-178a50c2df87' },
  other:      { icon: Ticket,   word: 'LIVE',       photo: 'photo-1524368535928-5b5e00ddc76b' },
};

export default function EventCover({ category, title, className = '', size = 'md' }: EventCoverProps) {
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;
  const sizeClasses = { sm: 'h-40', md: 'h-48', lg: 'h-72' };
  const photoUrl = `https://images.unsplash.com/${config.photo}?w=900&q=72&auto=format`;

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
