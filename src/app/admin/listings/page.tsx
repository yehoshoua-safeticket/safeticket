'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TicketPlus } from 'lucide-react';
import FieldSearch, { type SearchFilter } from '@/components/ui/FieldSearch';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Listing, ListingStatus } from '@/types/database';

export default function AdminListingsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const SEARCH_FIELDS = [
    { field: 'all', label: t.admin.listings.fieldAll },
    { field: 'event', label: t.admin.listings.fieldEvent },
    { field: 'seller', label: t.admin.listings.fieldSeller },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('listings')
      .select('*, event:events(id,title), seller:profiles(id,full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data || []) as Listing[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => listings.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all') {
        if (!l.event?.title?.toLowerCase().includes(q) && !l.seller?.full_name?.toLowerCase().includes(q)) return false;
      } else if (f.field === 'event') {
        if (!l.event?.title?.toLowerCase().includes(q)) return false;
      } else if (f.field === 'seller') {
        if (!l.seller?.full_name?.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [listings, filterStatus, searchFilters]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  async function bulkApprove() {
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('listings').update({ status: 'active' }).eq('id', id)));
    setListings((prev) => prev.map((l) => selected.has(l.id) ? { ...l, status: 'active' as ListingStatus } : l));
    setSelected(new Set());
  }

  async function bulkReject() {
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('listings').update({ status: 'rejected' }).eq('id', id)));
    setListings((prev) => prev.map((l) => selected.has(l.id) ? { ...l, status: 'rejected' as ListingStatus } : l));
    setSelected(new Set());
  }

  async function executeBulkDelete() {
    setBulkDeleting(true);
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('listings').delete().eq('id', id)));
    setListings((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.listings.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.listings.subtitle}</p>
        </div>
        <button
          onClick={() => router.push('/admin/listings/new')}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <TicketPlus className="h-4 w-4" />
          {t.admin.listings.addListing}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={SEARCH_FIELDS}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.listings.searchPlaceholder}
          className="min-w-[280px] flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.listings.allStatuses}</option>
          <option value="pending_review">{t.admin.listings.statusPendingReview}</option>
          <option value="active">{t.admin.listings.statusActive}</option>
          <option value="sold">{t.admin.listings.statusSold}</option>
          <option value="rejected">{t.admin.listings.statusRejected}</option>
          <option value="expired">{t.admin.listings.statusExpired}</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            <button onClick={bulkApprove} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">{t.admin.listings.bulkApprove}</button>
            <button onClick={bulkReject} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">{t.admin.listings.bulkReject}</button>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.listings.deleteConfirm.replace('{n}', String(selected.size))}</span>
                <button onClick={executeBulkDelete} disabled={bulkDeleting} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">{t.common.confirm}</button>
                <button onClick={() => setConfirmBulkDelete(false)} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--input-bg)]">{t.common.cancel}</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBulkDelete(true)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">{t.common.delete}</button>
            )}
          </div>
          <button onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.listings.empty}</div>
        ) : (
          <table className="w-full">
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
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colEvent}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colSeller}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colPrice}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colStatus}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colRisk}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.listings.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => router.push(`/admin/listings/${l.id}`)} className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]">
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggleSelect(l.id)}
                      className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[var(--foreground)]">{l.event?.title || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{l.seller?.full_name || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--foreground)]">₪{l.asking_price}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={l.risk_status} /></td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{new Date(l.created_at).toLocaleDateString('he-IL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
