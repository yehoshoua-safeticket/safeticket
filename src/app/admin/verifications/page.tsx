'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FieldSearch, { type SearchFilter } from '@/components/ui/FieldSearch';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/i18n/LocaleProvider';

interface VRow {
  id: string;
  user_id: string;
  document_type: string;
  status: string;
  reviewed_at: string | null;
  created_at: string;
  user: { id: string; full_name: string; email: string; verification_status: string } | null;
}

export default function AdminVerificationsPage() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';
  const router = useRouter();
  const [rows, setRows] = useState<VRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  const SEARCH_FIELDS = [
    { field: 'all', label: t.admin.verifications.fieldAll },
    { field: 'user', label: t.admin.verifications.fieldUser },
  ];

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/verifications');
    const data = await res.json();
    setRows(res.ok ? (data.verifications ?? []) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const docLabel = (d: string) => d === 'passport' ? t.admin.verifications.docPassport : d === 'license' ? t.admin.verifications.docLicense : t.admin.verifications.docId;

  const filtered = useMemo(() => rows.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      const hay = `${r.user?.full_name ?? ''} ${r.user?.email ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, filterStatus, searchFilters]);

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));
  }

  async function bulkSet(status: 'verified' | 'rejected') {
    setWorking(true);
    await fetch('/api/admin/verifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationIds: [...selected], status }),
    });
    setSelected(new Set());
    await load();
    setWorking(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.verifications.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.verifications.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FieldSearch fields={SEARCH_FIELDS} filters={searchFilters} onChange={setSearchFilters} placeholder={t.admin.verifications.searchPlaceholder} className="min-w-[280px] flex-1" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none">
          <option value="all">{t.admin.verifications.allStatuses}</option>
          <option value="pending">{t.status.pending}</option>
          <option value="verified">{t.status.verified}</option>
          <option value="rejected">{t.status.rejected}</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            <button disabled={working} onClick={() => bulkSet('verified')} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">{t.admin.verifications.bulkApprove}</button>
            <button disabled={working} onClick={() => bulkSet('rejected')} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">{t.admin.verifications.bulkReject}</button>
          </div>
          <button onClick={() => setSelected(new Set())} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.verifications.empty}</div>
        ) : (
          <>
          {/* Desktop: table */}
          <table className="hidden w-full lg:table">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="w-10 px-3 py-3.5">
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
                </th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.verifications.colUser}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.verifications.colDocType}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.verifications.colStatus}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.verifications.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => router.push(`/admin/verifications/${r.id}`)} className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]">
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-[var(--foreground)]">{r.user?.full_name || '—'}</div>
                    <div className="text-xs text-[var(--muted)]">{r.user?.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{docLabel(r.document_type)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{new Date(r.created_at).toLocaleDateString(dateLocale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: stacked cards */}
          <ul className="divide-y divide-[var(--card-border)] lg:hidden">
            {filtered.map((r) => (
              <li
                key={r.id}
                onClick={() => router.push(`/admin/verifications/${r.id}`)}
                className="cursor-pointer space-y-2 p-4 transition-colors hover:bg-[var(--input-bg)]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--input-border)] accent-[var(--accent)]"
                  />
                  <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">{r.user?.full_name || '—'}</p>
                  <span className="shrink-0"><StatusBadge status={r.status} /></span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 ps-7 text-sm text-[var(--muted)]">
                  <span>{r.user?.email}</span>
                  <span>{docLabel(r.document_type)}</span>
                  <span>{new Date(r.created_at).toLocaleDateString(dateLocale)}</span>
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
