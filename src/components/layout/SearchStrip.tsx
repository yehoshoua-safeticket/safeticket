'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Calendar, MapPin, X, ChevronDown } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import { CANONICAL_CITIES, presetRange, matchPreset, type DatePreset } from '@/lib/filters';

// Global search bar (sticky under the header on every public page) with two
// always-visible quick filters — Date and City. Selecting either navigates to
// /tickets with the choice preserved in the URL; the active value stays shown on
// the button. Deeper filters (category / price / sort) live under the tickets
// page's "סינון" button.
export default function SearchStrip() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const qParam = params.get('q') ?? '';
  const cityParam = params.get('city') ?? '';
  const fromParam = params.get('dateFrom') ?? '';
  const toParam = params.get('dateTo') ?? '';

  const [query, setQuery] = useState(qParam);
  const [open, setOpen] = useState<'date' | 'city' | null>(null);
  const [customFrom, setCustomFrom] = useState(fromParam);
  const [customTo, setCustomTo] = useState(toParam);
  const [citySearch, setCitySearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(qParam); }, [qParam]);
  useEffect(() => { setCustomFrom(fromParam); setCustomTo(toParam); }, [fromParam, toParam]);
  useEffect(() => { if (open !== 'city') setCitySearch(''); }, [open]);

  // Close any open popover on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(null); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Merge updates into the current params and navigate to the results page.
  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k); else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `/tickets?${qs}` : '/tickets');
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    apply({ q: query.trim() || null });
  }

  const presetLabels: Record<DatePreset, string> = {
    today: t.filterBar.presetToday,
    weekend: t.filterBar.presetWeekend,
    week: t.filterBar.presetWeek,
    month: t.filterBar.presetMonth,
  };

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  const dateActive = !!(fromParam || toParam);
  const activePreset = dateActive ? matchPreset(fromParam, toParam) : null;
  const dateLabel = !dateActive
    ? t.filterBar.dates
    : activePreset
      ? presetLabels[activePreset]
      : fromParam && toParam && fromParam !== toParam
        ? `${fmt(fromParam)} – ${fmt(toParam)}`
        : fmt(fromParam || toParam);

  const cityIndex = CANONICAL_CITIES.indexOf(cityParam);
  const cityActive = !!cityParam && cityIndex > 0;
  const cityLabel = cityActive ? t.filterBar.cities[cityIndex] : t.filterBar.city;

  const cityRows = CANONICAL_CITIES
    .map((value, i) => ({ value, label: t.filterBar.cities[i] }))
    .filter((c) => !citySearch || c.label.includes(citySearch) || c.value.includes(citySearch));

  const chip = 'flex items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition sm:justify-start';
  const chipOn = 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]';
  const chipOff = 'border-[var(--card-border)] bg-white text-[var(--muted)] hover:border-[var(--muted)]';
  const popover = 'absolute top-full z-50 mt-2 inset-x-5 rounded-lg border border-[var(--card-border)] bg-white p-3 shadow-xl sm:inset-x-auto sm:end-8 sm:w-72';

  return (
    <div className="sticky top-14 z-40 border-b border-[var(--card-border)] bg-white/85 backdrop-blur-md">
      <div ref={wrapRef} className="relative mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-5 py-3 sm:px-8">
        {/* Search pill */}
        <form
          onSubmit={submitSearch}
          className="order-first flex w-full items-center gap-2 rounded-lg border border-[var(--card-border)] bg-white ps-4 pe-1.5 py-1.5 shadow-sm transition focus-within:border-[var(--accent)] focus-within:shadow-md focus-within:ring-2 focus-within:ring-[var(--accent)]/15 sm:order-none sm:w-auto sm:min-w-[12rem] sm:flex-1"
        >
          <Search className="h-5 w-5 shrink-0 text-[var(--muted)]" />
          <input
            type="text"
            placeholder={t.filterBar.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none sm:text-base"
          />
          <button type="submit" className="shrink-0 rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]">
            {t.fieldSearch.search}
          </button>
        </form>

        {/* Date quick filter */}
        <button
          type="button"
          onClick={() => setOpen(open === 'date' ? null : 'date')}
          className={`${chip} flex-1 sm:flex-none ${dateActive ? chipOn : chipOff}`}
          aria-haspopup="dialog"
          aria-expanded={open === 'date'}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="max-w-[9rem] truncate">{dateLabel}</span>
          {dateActive
            ? <X className="h-3.5 w-3.5 shrink-0 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); apply({ dateFrom: null, dateTo: null }); }} />
            : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        </button>

        {/* City quick filter (city only — no street-level) */}
        <button
          type="button"
          onClick={() => setOpen(open === 'city' ? null : 'city')}
          className={`${chip} flex-1 sm:flex-none ${cityActive ? chipOn : chipOff}`}
          aria-haspopup="dialog"
          aria-expanded={open === 'city'}
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="max-w-[8rem] truncate">{cityLabel}</span>
          {cityActive
            ? <X className="h-3.5 w-3.5 shrink-0 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); apply({ city: null }); }} />
            : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        </button>

        {/* ── Date popover ── */}
        {open === 'date' && (
          <div className={popover}>
            <div className="grid grid-cols-2 gap-2">
              {(['today', 'weekend', 'week', 'month'] as DatePreset[]).map((p) => {
                const on = activePreset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { const r = presetRange(p); setOpen(null); apply({ dateFrom: r.from, dateTo: r.to }); }}
                    className={`rounded-md border px-2 py-2 text-xs font-medium transition ${on ? chipOn : 'border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--accent)]'}`}
                  >
                    {presetLabels[p]}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-[var(--card-border)] pt-3">
              <p className="mb-2 text-xs font-semibold text-[var(--muted)]">{t.filterBar.customRange}</p>
              <div className="flex flex-col gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-[0.65rem] text-[var(--muted)]">{t.filterBar.from}</span>
                  <input type="date" dir="ltr" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full min-w-0 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[0.65rem] text-[var(--muted)]">{t.filterBar.to}</span>
                  <input type="date" dir="ltr" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full min-w-0 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button type="button" onClick={() => { setOpen(null); apply({ dateFrom: null, dateTo: null }); }} className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
                  {t.filterBar.clear}
                </button>
                <button
                  type="button"
                  disabled={!customFrom && !customTo}
                  onClick={() => { setOpen(null); apply({ dateFrom: customFrom || customTo || null, dateTo: customTo || customFrom || null }); }}
                  className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
                >
                  {t.filterBar.apply}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── City popover (with a little search box) ── */}
        {open === 'city' && (
          <div className={popover}>
            <div className="mb-2 flex items-center gap-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
              <input
                autoFocus
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder={t.filterBar.city}
                className="min-w-0 flex-1 bg-transparent text-sm placeholder-[var(--muted)] focus:outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {cityRows.map(({ value, label }) => {
                const on = (value === '' && !cityActive) || value === cityParam;
                return (
                  <button
                    key={value || 'all'}
                    type="button"
                    onClick={() => { setOpen(null); apply({ city: value || null }); }}
                    className={`block w-full rounded-md px-3 py-2 text-start text-sm transition ${on ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-text)]' : 'text-[var(--foreground)] hover:bg-[var(--surface-2)]'}`}
                  >
                    {label}
                  </button>
                );
              })}
              {cityRows.length === 0 && (
                <p className="px-3 py-2 text-sm text-[var(--muted)]">—</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
