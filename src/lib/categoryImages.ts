import type { EventCategory } from '@/types/database';

// Bright, sunny category cover photos — one source of truth used by the homepage
// category tiles and EventCover. Sports = green football pitch.
export const CATEGORY_PHOTO_ID: Record<string, string> = {
  concert:    'photo-1514525253161-7a46d19cd819', // vibrant colourful stage lights
  sports:     'photo-1551958219-acbc608c6377',    // sunny green football pitch + balls
  theater:    'photo-1580809361436-42a7ec204889', // bright golden opera house
  festival:   'photo-1506157786151-b8491531f063', // bright festival crowd
  conference: 'photo-1515187029135-18ee286d815b', // bright gallery talk
  other:      'photo-1523580494863-6f3031224c94', // bright hall
};

export function categoryImage(category: EventCategory | string, w = 900): string {
  const id = CATEGORY_PHOTO_ID[category] ?? CATEGORY_PHOTO_ID.other;
  return `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format`;
}
