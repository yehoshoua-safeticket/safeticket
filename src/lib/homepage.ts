import { createClient } from '@/lib/supabase-server';
import { categoryImage } from '@/lib/categoryImages';
import type { Event, EventCategory } from '@/types/database';

export type EventWithListings = Event & { lowestPrice: number };
export type CategoryTile = { category: EventCategory; image_url: string };

const CATEGORY_ORDER: EventCategory[] = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

// Category artwork is a fixed, hardcoded map — it has no data dependency, so it
// is a module constant rather than something the homepage waits on.
export const CATEGORY_TILES: CategoryTile[] = CATEGORY_ORDER.slice(0, 4).map((category) => ({
  category,
  image_url: categoryImage(category),
}));

const FEATURED_LIMIT = 5;

/**
 * Curated homepage carousel, fetched on the server so the markup (and the image
 * URLs the browser preload scanner needs) ship in the initial HTML.
 *
 * A missing table just yields an empty result (PostgREST 404 -> error, data
 * null), so the section hides cleanly rather than throwing.
 */
export async function getFeaturedEvents(): Promise<EventWithListings[]> {
  const supabase = await createClient();

  const { data: featuredRows } = await supabase
    .from('featured_events')
    .select('event_id, position, event:events(*)')
    .order('position', { ascending: true });

  type FeatRow = { event: Event | null };
  const events = ((featuredRows as FeatRow[] | null) || [])
    .map((row) => row.event)
    // Hide-until-set: only events that actually have an image.
    .filter((e): e is Event => !!e && !!e.image_url)
    .slice(0, FEATURED_LIMIT);

  if (events.length === 0) return [];

  // Scoped to the handful of events we actually render. Previously this pulled
  // every active listing in the table to price at most five cards.
  const { data: listings } = await supabase
    .from('listings')
    .select('event_id, asking_price')
    .eq('status', 'active')
    .in('event_id', events.map((e) => e.id));

  const lowest = new Map<string, number>();
  for (const l of listings || []) {
    const current = lowest.get(l.event_id);
    if (current === undefined || l.asking_price < current) lowest.set(l.event_id, l.asking_price);
  }

  return events.map((e) => ({ ...e, lowestPrice: lowest.get(e.id) ?? 0 }));
}
