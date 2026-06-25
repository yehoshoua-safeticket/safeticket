'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CalendarPlus } from 'lucide-react';
import FieldSearch from '@/components/ui/FieldSearch';
import type { SearchFilter } from '@/components/ui/FieldSearch';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Event, EventCategory } from '@/types/database';

type EventWithCount = Event & { activeListingCount: number };

export default function AdminEventsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [working, setWorking] = useState(false);

  const SEARCH_FIELDS = [
    { field: 'all', label: t.admin.events.fieldAll },
    { field: 'title', label: t.admin.events.fieldTitle },
    { field: 'venue', label: t.admin.events.fieldVenue },
    { field: 'city', label: t.admin.events.fieldCity },
  ];

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [eventsRes, listingsRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('listings').select('event_id').eq('status', 'active'),
    ]);
    const counts = new Map<string, number>();
    for (const l of listingsRes.data || []) {
      counts.set(l.event_id, (counts.get(l.event_id) || 0) + 1);
    }
    const enriched = (eventsRes.data || []).map((e) => ({
      ...e,
      activeListingCount: counts.get(e.id) || 0,
    }));
    setEvents(enriched as EventWithCount[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => events.filter((e) => {
    if (filterStatus !== 'all' && (e.status ?? 'active') !== filterStatus) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      const matchAll =
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q);
      if (f.field === 'all' && !matchAll) return false;
      if (f.field === 'title' && !e.title.toLowerCase().includes(q)) return false;
      if (f.field === 'venue' && !e.venue.toLowerCase().includes(q)) return false;
      if (f.field === 'city' && !e.city.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [events, searchFilters, filterStatus]);

  async function bulkSetStatus(status: 'active' | 'rejected') {
    setWorking(true);
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: [...selected], status }),
    });
    setSelected(new Set());
    await load();
    setWorking(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    setSelected(
      filtered.length > 0 && selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((e) => e.id))
    );
  }

  async function executeBulkDelete() {
    setBulkDeleting(true);
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('events').delete().eq('id', id)));
    setEvents(prev => prev.filter((e) => ![...selected].includes(e.id)));
    setBulkDeleting(false);
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.events.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.events.subtitle}</p>
        </div>
        <button
          onClick={() => router.push('/admin/events/new')}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <CalendarPlus className="h-4 w-4" />
          {t.admin.events.addEvent}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={SEARCH_FIELDS}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.events.searchPlaceholder}
          className="min-w-[280px] flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.events.allStatuses}</option>
          <option value="pending_review">{t.admin.events.statusPending}</option>
          <option value="active">{t.admin.events.statusActive}</option>
          <option value="rejected">{t.admin.events.statusRejected}</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            <button disabled={working} onClick={() => bulkSetStatus('active')} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">{t.admin.events.bulkApprove}</button>
            <button disabled={working} onClick={() => bulkSetStatus('rejected')} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50">{t.admin.events.bulkReject}</button>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.common.deleteConfirm.replace('{n}', String(selected.size))}</span>
                <button
                  onClick={executeBulkDelete}
                  disabled={bulkDeleting}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  {t.common.confirm}
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(false)}
                  className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--input-bg)]"
                >
                  {t.common.cancel}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                {t.common.delete}
              </button>
            )}
          </div>
          <button
            onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }}
            className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {t.common.clearSelection}
          </button>
        </div>
      )}

      <p className="mb-3 text-sm text-[var(--muted)]">{t.admin.events.count.replace('{n}', String(filtered.length))}</p>

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.events.empty}</div>
        ) : (
          <>
          {/* Desktop: table */}
          <table className="hidden w-full lg:table">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
                  />
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colName}</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colVenue}</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colDate}</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colCategory}</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colStatus}</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--muted)]">{t.admin.events.colActiveListings}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/admin/events/${e.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]"
                >
                  <td className="px-3 py-3.5" onClick={(ev) => ev.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-[var(--foreground)]">{e.title}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--muted)]">{e.venue}, {e.city}</td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">
                    {new Date(e.event_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">
                    {(t.eventCategory as Record<string, string>)[e.category] ?? e.category}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={e.status ?? 'active'} /></td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">{e.activeListingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: stacked cards */}
          <ul className="divide-y divide-[var(--card-border)] lg:hidden">
            {filtered.map((e) => (
              <li
                key={e.id}
                onClick={() => router.push(`/admin/events/${e.id}`)}
                className="cursor-pointer space-y-2 p-4 transition-colors hover:bg-[var(--input-bg)]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--input-border)] accent-[var(--accent)]"
                  />
                  <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">{e.title}</p>
                  <span className="shrink-0 text-sm text-[var(--foreground)]">{t.admin.events.colActiveListings}: {e.activeListingCount}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 ps-7 text-sm text-[var(--muted)]">
                  <span>{e.venue}, {e.city}</span>
                  <span>{new Date(e.event_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{(t.eventCategory as Record<string, string>)[e.category] ?? e.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 ps-7">
                  <StatusBadge status={e.status ?? 'active'} />
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </div>
  );
}
