'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import FieldSearch, { type SearchFilter } from '@/components/ui/FieldSearch';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Dispute, DisputeStatus } from '@/types/database';

export default function AdminDisputesPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const SEARCH_FIELDS = [
    { field: 'all', label: t.admin.disputes.fieldAll },
    { field: 'reason', label: t.admin.disputes.fieldReason },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDisputes((data || []) as Dispute[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => disputes.filter((d) => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all' || f.field === 'reason') {
        if (!d.reason?.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [disputes, filterStatus, searchFilters]);

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
      setSelected(new Set(filtered.map((d) => d.id)));
    }
  }

  async function bulkSetStatus(status: DisputeStatus) {
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('disputes').update({ status }).eq('id', id)));
    setDisputes((prev) => prev.map((d) => selected.has(d.id) ? { ...d, status } : d));
    setSelected(new Set());
  }

  async function executeBulkDelete() {
    setBulkDeleting(true);
    const supabase = createClient();
    await Promise.all([...selected].map((id) => supabase.from('disputes').delete().eq('id', id)));
    setDisputes((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.disputes.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.disputes.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={SEARCH_FIELDS}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.disputes.searchPlaceholder}
          className="min-w-[280px] flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.disputes.allStatuses}</option>
          <option value="open">{t.admin.disputes.statusOpen}</option>
          <option value="under_review">{t.admin.disputes.statusUnderReview}</option>
          <option value="resolved_buyer">{t.admin.disputes.statusResolvedBuyer}</option>
          <option value="resolved_seller">{t.admin.disputes.statusResolvedSeller}</option>
          <option value="closed">{t.admin.disputes.statusClosed}</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkSetStatus('under_review')} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">{t.admin.disputes.bulkUnderReview}</button>
            <button onClick={() => bulkSetStatus('closed')} className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200">{t.admin.disputes.bulkClose}</button>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.disputes.deleteConfirm.replace('{n}', String(selected.size))}</span>
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
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.disputes.empty}</div>
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
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.disputes.colId}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.disputes.colReason}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.disputes.colStatus}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.disputes.colDate}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.disputes.colResolution}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => router.push(`/admin/disputes/${d.id}`)} className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]">
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                      className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--muted)]">#{d.id.slice(-6)}</td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-sm text-[var(--foreground)]">{d.reason}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{new Date(d.created_at).toLocaleDateString('he-IL')}</td>
                  <td className="max-w-[180px] truncate px-5 py-3.5 text-sm text-[var(--muted)]">
                    {d.admin_resolution ? d.admin_resolution.slice(0, 40) + (d.admin_resolution.length > 40 ? '...' : '') : t.admin.disputes.pending}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
