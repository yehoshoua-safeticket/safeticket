'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Image as ImageIcon, ImageOff, Save } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event, EventCategory } from '@/types/database';

const CATEGORIES: EventCategory[] = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

export default function AdminCategoryCoversPage() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  const [events, setEvents] = useState<Event[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({}); // category -> event_id
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [evRes, covRes] = await Promise.all([
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        fetch('/api/admin/category-covers').then((r) => r.json()).catch(() => ({ covers: [] })),
      ]);
      setEvents((evRes.data || []) as Event[]);
      const map: Record<string, string> = {};
      for (const c of covRes.covers || []) map[c.category] = c.event_id;
      setCovers(map);
      setLoading(false);
    }
    load();
  }, []);

  const byId = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const categoryLabel = (c: EventCategory) => t.eventCategory[c] ?? c;
  const dateStr = (e: Event) => new Date(e.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });

  function setCover(category: EventCategory, eventId: string) {
    setCovers((prev) => {
      const next = { ...prev };
      if (eventId) next[category] = eventId;
      else delete next[category];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    // Send every category so cleared ones are deleted server-side.
    const payload: Record<string, string | null> = {};
    for (const c of CATEGORIES) payload[c] = covers[c] || null;
    const res = await fetch('/api/admin/category-covers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ covers: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.categoryCovers.saveError);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
            <ImageIcon className="h-5 w-5 text-[var(--accent-text)]" />
            {t.admin.categoryCovers.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.categoryCovers.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saved ? t.admin.categoryCovers.saved : saving ? t.common.saving : t.common.save}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const chosen = covers[cat] ? byId.get(covers[cat]) : undefined;
            const missingImage = chosen && !chosen.image_url;
            return (
              <div key={cat} className="flex items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                {/* Preview */}
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-2)]">
                  {chosen?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={chosen.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[var(--muted)]"><ImageOff className="h-5 w-5" /></span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-sm font-semibold text-[var(--foreground)]">{categoryLabel(cat)}</p>
                  <select
                    value={covers[cat] || ''}
                    onChange={(e) => setCover(cat, e.target.value)}
                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="">{t.admin.categoryCovers.none}</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.image_url ? '🖼  ' : ''}{e.title} — {dateStr(e)}
                      </option>
                    ))}
                  </select>
                  {missingImage && (
                    <p className="mt-1.5 text-xs text-[var(--warning)]">{t.admin.categoryCovers.noImageHint}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
