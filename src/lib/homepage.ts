import { createClient } from '@/lib/supabase-server';
import { categoryImage } from '@/lib/categoryImages';
import type { Event, EventCategory } from '@/types/database';

export type EventWithListings = Event & { lowestPrice: number };
export type CategoryRow = { category: EventCategory; events: EventWithListings[] };

const CATEGORY_ORDER: EventCategory[] = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

const FEATURED_LIMIT = 5;

// How many events each category carousel holds. Rows scroll, so this is about
// keeping the payload sane rather than about what fits on screen.
const CATEGORY_ROW_LIMIT = 12;

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

  const lowest = await lowestPrices(events.map((e) => e.id));

  return events.map((e) => ({ ...e, lowestPrice: lowest.get(e.id) ?? 0 }));
}

/**
 * "From" price per event: the cheapest active listing. Always scoped to the
 * events actually being rendered — pricing a dozen cards must not pull every
 * active listing in the table.
 */
async function lowestPrices(eventIds: string[]): Promise<Map<string, number>> {
  const lowest = new Map<string, number>();
  if (eventIds.length === 0) return lowest;

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('event_id, asking_price')
    .eq('status', 'active')
    .in('event_id', eventIds);

  for (const l of listings || []) {
    const current = lowest.get(l.event_id);
    if (current === undefined || l.asking_price < current) lowest.set(l.event_id, l.asking_price);
  }
  return lowest;
}

/**
 * One carousel per category, each holding that category's own events. Empty
 * categories drop out entirely rather than rendering an empty row.
 *
 * Events without their own artwork fall back to the category photo, so a
 * missing image costs a generic cover rather than the whole card.
 */
export async function getEventsByCategory(): Promise<CategoryRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  const events = (data as Event[] | null) || [];
  if (events.length === 0) return [];

  const rows = CATEGORY_ORDER
    .map((category) => ({
      category,
      events: events.filter((e) => e.category === category).slice(0, CATEGORY_ROW_LIMIT),
    }))
    .filter((row) => row.events.length > 0);

  const lowest = await lowestPrices(rows.flatMap((r) => r.events.map((e) => e.id)));

  return rows.map((row) => ({
    category: row.category,
    events: row.events.map((e) => ({
      ...e,
      image_url: e.image_url || categoryImage(e.category),
      lowestPrice: lowest.get(e.id) ?? 0,
    })),
  }));
}
