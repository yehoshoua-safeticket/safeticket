'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Users, Plus, X, Eye, EyeOff } from 'lucide-react';
import type { Profile } from '@/types/database';
import FieldSearch from '@/components/ui/FieldSearch';
import type { SearchFilter } from '@/components/ui/FieldSearch';
import { useLocale } from '@/i18n/LocaleProvider';

interface FormState {
  name: string;
  email: string;
  password: string;
}

const emptyForm: FormState = { name: '', email: '', password: '' };

export default function TeamPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'internal_user'])
      .order('created_at', { ascending: true });
    setMembers((data || []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => members.filter((m) => {
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all') {
        if (!m.full_name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      } else if (f.field === 'full_name') {
        if (!m.full_name.toLowerCase().includes(q)) return false;
      } else if (f.field === 'email') {
        if (!m.email.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [members, searchFilters]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    setSelected(filtered.length > 0 && selected.size === filtered.length ? new Set() : new Set(filtered.map(m => m.id)));
  }

  async function executeBulkDelete() {
    setBulkDeleting(true);
    await Promise.all([...selected].filter(id => id !== currentUserId).map(userId =>
      fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    ));
    setBulkDeleting(false);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    load();
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || t.admin.team.errorCreate); return; }
    setShowForm(false);
    setForm(emptyForm);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.team.title}</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{t.admin.team.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t.admin.team.addMember}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t.admin.team.newMemberTitle}</h3>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }} className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--input-bg)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.team.fullName}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.admin.team.namePlaceholder}
                className="w-full rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.team.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t.admin.team.emailPlaceholder}
                className="w-full rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.team.tempPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t.admin.team.passwordPlaceholder}
                  className="w-full rounded-lg border border-[var(--input-border)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name || !form.email || !form.password}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? t.admin.team.creating : t.admin.team.createAccount}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); }}
              className="rounded-lg border border-[var(--input-border)] px-5 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--input-bg)]"
            >
              {t.admin.team.cancel}
            </button>
            <p className="text-xs text-[var(--muted)]">{t.admin.team.createNote}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <FieldSearch
          fields={[
            { field: 'all', label: t.admin.team.fieldAll },
            { field: 'full_name', label: t.admin.team.fieldName },
            { field: 'email', label: t.admin.team.fieldEmail },
          ]}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.team.searchPlaceholder}
          className="max-w-sm"
        />
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex items-center gap-2">
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.team.deleteConfirm.replace('{n}', String(selected.size))}</span>
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
          <div className="py-12 text-center text-sm text-[var(--muted)]">{members.length === 0 ? t.admin.team.emptyNoMembers : t.admin.team.emptyNoResults}</div>
        ) : (
          <>
          {/* Desktop: table */}
          <table className="hidden w-full lg:table">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
                </th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.team.colName}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.team.colEmail}</th>
                <th className="px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.team.colJoined}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/admin/internal_users/${m.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]"
                >
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                        {m.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">{m.full_name}</span>
                      {m.id === currentUserId && (
                        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-text)]">{t.common.you}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{m.email}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">
                    {new Date(m.created_at).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: stacked cards */}
          <ul className="divide-y divide-[var(--card-border)] lg:hidden">
            {filtered.map((m) => (
              <li
                key={m.id}
                onClick={() => router.push(`/admin/internal_users/${m.id}`)}
                className="cursor-pointer space-y-2 p-4 transition-colors hover:bg-[var(--input-bg)]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSelect(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--input-border)] accent-[var(--accent)]"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                      {m.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">{m.full_name}</span>
                  </div>
                  {m.id === currentUserId && (
                    <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-text)]">{t.common.you}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 ps-7 text-sm text-[var(--muted)]">
                  <span>{m.email}</span>
                  <span>{new Date(m.created_at).toLocaleDateString('he-IL')}</span>
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
