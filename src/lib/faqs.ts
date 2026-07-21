import { createClient } from '@/lib/supabase-server';
import type { Faq } from '@/types/database';

/**
 * Published FAQ entries in display order, fetched on the server so the copy
 * ships in the initial HTML and stays indexable.
 *
 * A missing table (pre-migration) yields an empty list rather than throwing, so
 * the page degrades to hiding the section — same contract as the homepage
 * curation tables.
 */
export async function getFaqs(): Promise<Faq[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('published', true)
    .order('position', { ascending: true });

  if (error) return [];
  return (data as Faq[] | null) ?? [];
}
