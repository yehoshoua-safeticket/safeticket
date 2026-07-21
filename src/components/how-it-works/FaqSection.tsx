'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { useLocale } from '@/i18n/LocaleProvider';
import { localizeFaq } from '@/lib/faq-locale';
import type { Faq } from '@/types/database';

/**
 * FAQ list with a plain type-to-filter search. Filtering is a substring match
 * over question, answer and the record's `keywords`, so an entry can be found
 * by words its copy never uses.
 */
export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  const { t, locale } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const items = useMemo(() => faqs.map((f) => localizeFaq(f, locale)), [faqs, locale]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    // Every whitespace-separated term must appear somewhere in the record.
    const terms = q.split(/\s+/);
    return items.filter((item) => {
      const haystack = `${item.question} ${item.answer} ${item.keywords}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, query]);

  if (faqs.length === 0) return null;

  return (
    <div id="faq" className="mt-24 scroll-mt-24">
      <FadeIn>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-[var(--foreground)]">{t.faq.title}</h2>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="relative mb-6">
          <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.faq.searchPlaceholder}
            aria-label={t.faq.searchPlaceholder}
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3 pe-4 ps-11 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none"
          />
        </div>
      </FadeIn>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">
          {t.faq.noMatches.replace('{q}', query.trim())}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => {
            const open = openId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] transition-all hover:border-[var(--input-border)] hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 p-6 text-start"
                >
                  <span className="font-semibold text-[var(--foreground)]">{item.question}</span>
                  {open
                    ? <ChevronUp className="h-5 w-5 shrink-0 text-[var(--muted)]" />
                    : <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted)]" />}
                </button>
                {/* Collapsed with a 0fr→1fr grid row rather than unmounting or a
                    fixed max-height: the answer stays in the DOM (so it is
                    indexable and findable by in-page search) and the panel is
                    sized by its own content, so long answers never clip. */}
                <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-[var(--card-border)] px-6 pb-6 pt-4">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{item.answer}</p>
                      {/* The footnote belongs to this answer, so it lives inside
                          the panel rather than at the foot of the whole list. */}
                      {item.asterisk && (
                        <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{item.asterisk}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
