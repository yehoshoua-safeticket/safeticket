import type { Faq } from '@/types/database';

/**
 * Locale-resolved view of a record, falling back to Hebrew when the English
 * field is blank.
 *
 * Kept apart from lib/faqs.ts on purpose: that module reaches for the server
 * Supabase client (and so `next/headers`), which cannot be pulled into a client
 * bundle. This helper is pure, so both sides can use it.
 */
export function localizeFaq(faq: Faq, locale: string) {
  const en = locale === 'en';
  return {
    id: faq.id,
    question: (en && faq.question_en.trim()) || faq.question_he,
    answer: (en && faq.answer_en.trim()) || faq.answer_he,
    asterisk: (en && faq.asterisk_en.trim()) || faq.asterisk_he,
    keywords: faq.keywords,
  };
}
