'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

// Deep filters for the tickets page — category, price and sort — tucked under a
// "סינון" button. Search / date / city live in the global search strip. All
// state is kept in the URL so both controls stay in sync.
export default function FilterBar() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get('category') ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const sort = params.get('sort') ?? '';

  const activeCount = [category, minPrice, maxPrice, sort].filter(Boolean).length;
  const [isOpen, setIsOpen] = useState(false);

  // Open the panel automatically when arriving with a filter already applied
  // (e.g. the homepage category tiles link to /tickets?category=…).
  useEffect(() => { if (activeCount > 0) setIsOpen(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k); else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `/tickets?${qs}` : '/tickets');
  }

  function clearPanel() {
    set({ category: null, minPrice: null, maxPrice: null, sort: null });
  }

  const categories = [
    { value: '', label: t.filterBar.categoryAll },
    { value: 'concert', label: t.filterBar.categoryConcert },
    { value: 'sports', label: t.filterBar.categorySports },
    { value: 'theater', label: t.filterBar.categoryTheater },
    { value: 'festival', label: t.filterBar.categoryFestival },
    { value: 'conference', label: t.filterBar.categoryConference },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-lg border px-5 py-3 text-sm transition ${
            isOpen || activeCount > 0 ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]' : 'border-[var(--input-border)] text-[var(--muted)] hover:border-[var(--muted)]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>{t.filterBar.filter}</span>
          {activeCount > 0 && (
            <span className="ms-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-xs font-bold text-white">{activeCount}</span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={clearPanel} className="flex items-center gap-1 rounded-lg border border-[var(--input-border)] px-4 py-3 text-sm text-[var(--muted)] hover:border-[var(--muted)]">
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.filterBar.clear}</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">{t.filterBar.category}</label>
            <select value={category} onChange={(e) => set({ category: e.target.value || null })} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none">
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">{t.filterBar.sortBy}</label>
            <select value={sort} onChange={(e) => set({ sort: e.target.value || null })} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none">
              <option value="">{t.filterBar.sortDate}</option>
              <option value="priceLow">{t.filterBar.sortPriceLow}</option>
              <option value="priceHigh">{t.filterBar.sortPriceHigh}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">{t.filterBar.minPrice}</label>
            <input type="number" placeholder={t.filterBar.minPricePlaceholder} value={minPrice} onChange={(e) => set({ minPrice: e.target.value || null })} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">{t.filterBar.maxPrice}</label>
            <input type="number" placeholder={t.filterBar.maxPricePlaceholder} value={maxPrice} onChange={(e) => set({ maxPrice: e.target.value || null })} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
