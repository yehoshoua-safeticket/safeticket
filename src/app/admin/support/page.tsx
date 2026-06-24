'use client';

import { useState, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import FieldSearch, { type SearchFilter } from '@/components/ui/FieldSearch';
import { useLocale } from '@/i18n/LocaleProvider';

const mockSupportMessages = [
  { id: 's-1', from: 'rachel@example.com', subject: 'לא קיבלתי את הכרטיס', date: '2026-05-17T10:00:00Z', status: 'open' as const },
  { id: 's-2', from: 'yossi@example.com', subject: 'איך מעדכנים מחיר?', date: '2026-05-16T14:00:00Z', status: 'replied' as const },
  { id: 's-3', from: 'david@example.com', subject: 'רוצה לבטל מודעה', date: '2026-05-15T09:00:00Z', status: 'open' as const },
];

export default function AdminSupportPage() {
  const { t } = useLocale();
  const [messages, setMessages] = useState(mockSupportMessages);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const SEARCH_FIELDS = [
    { field: 'all', label: t.admin.support.fieldAll },
    { field: 'from', label: t.admin.support.fieldFrom },
    { field: 'subject', label: t.admin.support.fieldSubject },
  ];

  const filtered = useMemo(() => messages.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all') {
        if (!m.from.toLowerCase().includes(q) && !m.subject.toLowerCase().includes(q)) return false;
      } else if (f.field === 'from') {
        if (!m.from.toLowerCase().includes(q)) return false;
      } else if (f.field === 'subject') {
        if (!m.subject.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [messages, filterStatus, searchFilters]);

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
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  }

  async function bulkMarkReplied() {
    setMessages((prev) => prev.map((m) => selected.has(m.id) ? { ...m, status: 'replied' as const } : m));
    setSelected(new Set());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.support.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.support.subtitle}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          {t.admin.support.pendingBadge.replace('{n}', String(messages.filter((m) => m.status === 'open').length))}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={SEARCH_FIELDS}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.support.searchPlaceholder}
          className="min-w-[280px] flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.support.allStatuses}</option>
          <option value="open">{t.admin.support.statusOpen}</option>
          <option value="replied">{t.admin.support.statusReplied}</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            <button onClick={bulkMarkReplied} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">{t.admin.support.bulkMarkReplied}</button>
          </div>
          <button onClick={() => setSelected(new Set())} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.support.empty}</div>
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
                <th className="w-10 px-3 py-3.5"></th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.support.colSubject}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.support.colFrom}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.support.colDate}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.support.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((msg) => (
                <tr key={msg.id} className="transition-colors hover:bg-[var(--input-bg)]">
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(msg.id)}
                      onChange={() => toggleSelect(msg.id)}
                      className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <MessageCircle className={`h-4 w-4 ${msg.status === 'open' ? 'text-amber-500' : 'text-[var(--muted)]'}`} />
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[var(--foreground)]">{msg.subject}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{msg.from}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{new Date(msg.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${msg.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {msg.status === 'open' ? t.admin.support.statusOpen : t.admin.support.statusReplied}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-6 text-xs text-[var(--muted)]">
        {t.admin.support.footerNote}
      </p>
    </div>
  );
}
