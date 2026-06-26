'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Star, Search, ChevronUp, ChevronDown, X, Plus, ImageOff, Save } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event } from '@/types/database';

const MAX = 5;

export default function AdminFeaturedPage() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // ordered
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [evRes, featRes] = await Promise.all([
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        fetch('/api/admin/featured').then((r) => r.json()).catch(() => ({ featured: [] })),
      ]);
      setEvents((evRes.data || []) as Event[]);
      const ids = (featRes.featured || [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((f: { event_id: string }) => f.event_id);
      setSelectedIds(ids);
      setLoading(false);
    }
    load();
  }, []);

  const byId = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const selectedEvents = useMemo(
    () => selectedIds.map((id) => byId.get(id)).filter((e): e is Event => !!e),
    [selectedIds, byId]
  );

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (selectedIds.includes(e.id)) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    });
  }, [events, selectedIds, search]);

  function add(id: string) {
    if (selectedIds.length >= MAX || selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
    setSaved(false);
  }
  function remove(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setSaved(false);
  }
  function move(index: number, dir: -1 | 1) {
    setSelectedIds((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    const res = await fetch('/api/admin/featured', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: selectedIds.map((event_id) => ({ event_id })) }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.featured.saveError);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const dateStr = (e: Event) => new Date(e.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
            <Star className="h-5 w-5 text-[var(--accent-text)]" />
            {t.admin.featured.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.featured.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saved ? t.admin.featured.saved : saving ? t.common.saving : t.common.save}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Selected (ordered) */}
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.admin.featured.selectedTitle}</h2>
              <span className="text-xs text-[var(--muted)]">{t.admin.featured.selectedCount.replace('{n}', String(selectedEvents.length))}</span>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">{t.admin.featured.empty}</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--surface-2)] p-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-text)]">{i + 1}</span>
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[var(--muted)]"><ImageOff className="h-4 w-4" /></span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{e.title}</p>
                      {e.image_url ? (
                        <p className="truncate text-xs text-[var(--muted)]">{dateStr(e)}</p>
                      ) : (
                        <p className="truncate text-xs text-[var(--warning)]">{t.admin.featured.noImageHint}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.admin.featured.moveUp} className="rounded p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)] disabled:opacity-30">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === selectedEvents.length - 1} aria-label={t.admin.featured.moveDown} className="rounded p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)] disabled:opacity-30">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(e.id)} aria-label={t.admin.featured.remove} className="rounded p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Available */}
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.admin.featured.availableTitle}</h2>
            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.admin.featured.searchPlaceholder}
                className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pe-3 ps-9 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            {selectedIds.length >= MAX && (
              <p className="mb-2 rounded-md bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-[var(--accent-text)]">{t.admin.featured.maxReached}</p>
            )}
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">{t.admin.featured.emptyAvailable}</p>
            ) : (
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                {available.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] p-2.5">
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[var(--muted)]"><ImageOff className="h-4 w-4" /></span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{e.title}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{e.venue} · {dateStr(e)}</p>
                    </div>
                    <button
                      onClick={() => add(e.id)}
                      disabled={selectedIds.length >= MAX}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--input-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)] disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.admin.featured.add}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
