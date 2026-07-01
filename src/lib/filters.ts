// Shared filter helpers for the search strip and the tickets results page.
// Dates are handled as local YYYY-MM-DD strings so they round-trip cleanly
// through the URL and compare against event_date's calendar day.

export type DatePreset = 'today' | 'weekend' | 'week' | 'month';

// Canonical city values as stored in the DB (Hebrew). Index 0 ('') = all cities.
// Labels are localized via t.filterBar.cities (same order).
export const CANONICAL_CITIES = ['', 'תל אביב', 'ירושלים', 'חיפה', 'הרצליה', 'אילת'];

// Comprehensive list of Israeli cities/towns (Hebrew), ordered biggest-first so the
// common ones show at the top; the city filter is searchable, and free text is also
// allowed. City names are proper nouns → shown as-is in both locales.
export const ISRAEL_CITIES: string[] = [
  'ירושלים', 'תל אביב', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה',
  'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'בית שמש',
  'כפר סבא', 'הרצליה', 'חדרה', 'מודיעין', 'נצרת', 'לוד', 'רמלה', 'רעננה', 'גבעתיים',
  'הוד השרון', 'קריית גת', 'נהריה', 'קריית אתא', 'אילת', 'ראש העין', 'עפולה', 'טבריה',
  'אור יהודה', 'נס ציונה', 'יבנה', 'דימונה', 'טמרה', 'סח\'נין', 'שפרעם', 'אום אל-פחם',
  'קריית מוצקין', 'קריית ביאליק', 'קריית ים', 'קריית מלאכי', 'קריית שמונה', 'קריית עקרון',
  'אריאל', 'נשר', 'מגדל העמק', 'יקנעם עילית', 'כרמיאל', 'שדרות', 'טייבה', 'טירה',
  'באקה אל-גרבייה', 'כפר קאסם', 'מעלות-תרשיחא', 'נוף הגליל', 'צפת', 'בית שאן', 'אור עקיבא',
  'יהוד', 'טירת כרמל', 'גדרה', 'מזכרת בתיה', 'פרדס חנה-כרכור', 'זכרון יעקב',
  'בנימינה', 'כפר יונה', 'אלעד', 'גבעת שמואל', 'קריית טבעון', 'סביון', 'אבן יהודה',
  'כוכב יאיר', 'שוהם', 'גני תקווה', 'קדימה-צורן', 'רמת השרון', 'מיתר', 'עומר', 'להבים',
  'כפר ורדים', 'פרדסיה', 'תל מונד', 'קצרין', 'ערד', 'נתיבות', 'אופקים', 'מגדל', 'יבנאל',
  'מטולה', 'ראש פינה', 'עכו', 'מעלה אדומים', 'ביתר עילית', 'מודיעין עילית',
  'רהט', 'טובא-זנגריה', 'ג\'סר א-זרקא', 'כפר קרע', 'ערערה', 'כאבול', 'דיר אל-אסד',
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Compute an inclusive [from, to] YYYY-MM-DD range for a named preset.
export function presetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'today') return { from: toISODate(start), to: toISODate(start) };

  if (preset === 'week') {
    const to = new Date(start);
    to.setDate(to.getDate() + 6);
    return { from: toISODate(start), to: toISODate(to) };
  }

  if (preset === 'month') {
    const to = new Date(start.getFullYear(), start.getMonth() + 1, 0); // last day of month
    return { from: toISODate(start), to: toISODate(to) };
  }

  // weekend: the coming Friday–Saturday (Israel weekend). Sun=0 … Fri=5, Sat=6.
  const daysUntilFri = (5 - start.getDay() + 7) % 7;
  const fri = new Date(start);
  fri.setDate(fri.getDate() + daysUntilFri);
  const sat = new Date(fri);
  sat.setDate(sat.getDate() + 1);
  return { from: toISODate(fri), to: toISODate(sat) };
}

// If a [from, to] range exactly matches a preset, return its key (for highlighting).
export function matchPreset(from: string, to: string): DatePreset | null {
  const presets: DatePreset[] = ['today', 'weekend', 'week', 'month'];
  for (const p of presets) {
    const r = presetRange(p);
    if (r.from === from && r.to === to) return p;
  }
  return null;
}

// True when an event's date falls within the (optional) inclusive range.
export function inDateRange(eventDate: string, from: string, to: string): boolean {
  const day = toISODate(new Date(eventDate));
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}
