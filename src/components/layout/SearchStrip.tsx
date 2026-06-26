'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

// Slim search bar that sticks directly under the (thin) header on every public
// page. Sits at z-40 — below the navbar (z-50), above page content (z-2).
export default function SearchStrip() {
  const router = useRouter();
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/tickets?q=${encodeURIComponent(query.trim())}` : '/tickets');
  }

  return (
    <div className="sticky top-14 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-2 sm:px-8">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 transition focus-within:border-white/30"
        >
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            type="text"
            placeholder={t.filterBar.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/35 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-[#1a55e3] px-3.5 py-1 text-xs font-bold text-white transition hover:bg-[#1548cc]"
          >
            {t.fieldSearch.search}
          </button>
        </form>
      </div>
    </div>
  );
}
