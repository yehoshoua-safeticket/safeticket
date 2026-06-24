'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Users, ChevronDown, Plus, X, Eye, EyeOff } from 'lucide-react';
import type { Profile, UserRole, VerificationStatus } from '@/types/database';
import FieldSearch from '@/components/ui/FieldSearch';
import type { SearchFilter } from '@/components/ui/FieldSearch';
import { useLocale } from '@/i18n/LocaleProvider';

type GroupKey = 'none' | 'role' | 'verification' | 'joined_month' | 'joined_year' | 'joined_dow' | 'joined_week';

interface GroupEntry {
  key: string;
  profiles: Profile[];
  subgroups: Array<{ key: string; profiles: Profile[] }> | null;
}

interface CreateForm {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

const emptyCreateForm: CreateForm = { full_name: '', email: '', phone: '', password: '' };

function roleBadgeClass(role: UserRole) {
  if (role === 'admin') return 'bg-purple-100 text-purple-700';
  if (role === 'internal_user') return 'bg-emerald-50 text-emerald-700';
  return 'bg-blue-50 text-blue-700';
}

function verificationBadgeClass(status: VerificationStatus) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  if (status === 'rejected') return 'bg-red-50 text-red-600';
  return 'bg-[var(--input-bg)] text-[var(--muted)]';
}

function isoWeekNumber(d: Date): number {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d.getTime() - weekStart.getTime();
  return diff < 0 ? 52 : Math.floor(diff / (7 * 86400000)) + 1;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupKey>('none');
  const [groupBy2, setGroupBy2] = useState<GroupKey>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const GROUP_OPTIONS: { value: GroupKey; label: string }[] = [
    { value: 'none', label: t.groupBy.none },
    { value: 'verification', label: t.groupBy.verification },
    { value: 'joined_month', label: t.groupBy.joined_month },
    { value: 'joined_year', label: t.groupBy.joined_year },
    { value: 'joined_dow', label: t.groupBy.joined_dow },
    { value: 'joined_week', label: t.groupBy.joined_week },
  ];


  function roleLabel(role: UserRole): string {
    if (role === 'admin') return t.roles.admin;
    if (role === 'internal_user') return t.roles.internal_user;
    return t.roles.external_user;
  }

  function verificationLabel(status: VerificationStatus): string {
    if (status === 'verified') return t.status.verified;
    if (status === 'pending') return t.status.pending;
    if (status === 'rejected') return t.status.rejected;
    return t.status.unverified;
  }

  function getGroupInfo(p: Profile, key: GroupKey): { label: string; sortKey: string } {
    const d = new Date(p.created_at);
    switch (key) {
      case 'role': {
        const label = roleLabel(p.role);
        return { label, sortKey: [t.roles.admin, t.roles.internal_user, t.roles.external_user].indexOf(label).toString() };
      }
      case 'verification': {
        const label = verificationLabel(p.verification_status);
        return { label, sortKey: [t.status.verified, t.status.pending, t.status.unverified, t.status.rejected].indexOf(label).toString() };
      }
      case 'joined_month': {
        const label = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        return { label, sortKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
      }
      case 'joined_year': {
        const y = d.getFullYear().toString();
        return { label: y, sortKey: y };
      }
      case 'joined_dow': {
        return { label: t.daysOfWeek[d.getDay()], sortKey: d.getDay().toString() };
      }
      case 'joined_week': {
        const wn = isoWeekNumber(d);
        return {
          label: `${t.groupBy.joined_week} ${wn}`,
          sortKey: `${d.getFullYear()}-${String(wn).padStart(2, '0')}`,
        };
      }
      default:
        return { label: '', sortKey: '' };
    }
  }

  function buildGroupMap(profiles: Profile[], key: GroupKey) {
    const map = new Map<string, { profiles: Profile[]; sortKey: string }>();
    for (const p of profiles) {
      const { label, sortKey } = getGroupInfo(p, key);
      if (!map.has(label)) map.set(label, { profiles: [], sortKey });
      map.get(label)!.profiles.push(p);
    }
    return map;
  }

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? '');
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'external_user')
      .order('created_at', { ascending: false });
    setProfiles((data || []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => profiles.filter((p) => {
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all') {
        if (!p.full_name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
      } else {
        if (!(p[f.field as keyof Profile] as string || '').toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [profiles, searchFilters]);

  const grouped = useMemo<GroupEntry[] | null>(() => {
    if (groupBy === 'none') return null;

    const primaryMap = buildGroupMap(filtered, groupBy);
    const sortedPrimary = [...primaryMap.entries()].sort((a, b) =>
      a[1].sortKey.localeCompare(b[1].sortKey)
    );

    return sortedPrimary.map(([label, { profiles: pg }]) => {
      if (groupBy2 === 'none') {
        return { key: label, profiles: pg, subgroups: null };
      }
      const subMap = buildGroupMap(pg, groupBy2);
      const sortedSub = [...subMap.entries()].sort((a, b) =>
        a[1].sortKey.localeCompare(b[1].sortKey)
      );
      return {
        key: label,
        profiles: pg,
        subgroups: sortedSub.map(([sk, sv]) => ({ key: sk, profiles: sv.profiles })),
      };
    });
  }, [filtered, groupBy, groupBy2]);

  function toggleCollapse(id: string) {
    setCollapsedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    setSelected(filtered.length > 0 && selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  }

  function toggleGroupSelect(rows: Profile[]) {
    const allSelected = rows.every(p => selected.has(p.id));
    setSelected(prev => {
      const n = new Set(prev);
      if (allSelected) rows.forEach(p => n.delete(p.id));
      else rows.forEach(p => n.add(p.id));
      return n;
    });
  }

  async function applyBulkRole(role: UserRole) {
    setBulkSaving(true);
    await Promise.all([...selected].map(userId =>
      fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) })
    ));
    setBulkSaving(false);
    setSelected(new Set());
    load();
  }

  async function applyBulkVerification(verification_status: VerificationStatus) {
    setBulkSaving(true);
    await Promise.all([...selected].map(userId =>
      fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, verification_status }) })
    ));
    setBulkSaving(false);
    setSelected(new Set());
    load();
  }

  async function executeBulkDelete() {
    setBulkSaving(true);
    await Promise.all([...selected].filter(id => id !== currentUserId).map(userId =>
      fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    ));
    setBulkSaving(false);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    load();
  }

  async function handleCreate() {
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password) return;
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createForm.email,
        password: createForm.password,
        full_name: createForm.full_name,
        phone: createForm.phone || undefined,
      }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(json.error || t.admin.users.errorCreate); return; }
    setShowCreate(false);
    setCreateForm(emptyCreateForm);
    load();
  }

  function renderTableHead(rows: Profile[], onSelectAll: () => void) {
    const allSelected = rows.length > 0 && rows.every(p => selected.has(p.id));
    return (
      <tr className="border-b border-[var(--card-border)]">
        <th className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
          />
        </th>
        <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.users.colUser}</th>
        <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.users.colRole}</th>
        <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.users.colVerification}</th>
        <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{t.admin.users.colJoined}</th>
      </tr>
    );
  }

  function renderRow(p: Profile) {
    return (
      <tr
        key={p.id}
        onClick={() => router.push(`/admin/external_users/${p.id}`)}
        className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]"
      >
        <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(p.id)}
            onChange={() => toggleSelect(p.id)}
            className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]"
          />
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
              {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {p.full_name}
                {p.id === currentUserId && (
                  <span className="mr-1.5 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-text)]">{t.common.you}</span>
                )}
              </p>
              <p className="truncate text-xs text-[var(--muted)]">{p.email}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5">
          <span className={`${roleBadgeClass(p.role)} rounded-lg px-2.5 py-1 text-xs font-medium`}>
            {roleLabel(p.role)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={`${verificationBadgeClass(p.verification_status)} rounded-lg px-2.5 py-1 text-xs font-medium`}>
            {verificationLabel(p.verification_status)}
          </span>
        </td>
        <td className="px-5 py-3.5 text-sm text-[var(--muted)]">
          {new Date(p.created_at).toLocaleDateString('he-IL')}
        </td>
      </tr>
    );
  }

  function renderTable(rows: Profile[], onSelectAll: () => void) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>{renderTableHead(rows, onSelectAll)}</thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {rows.map(renderRow)}
          </tbody>
        </table>
      </div>
    );
  }

  function GroupSelect({ value, onChange, exclude }: { value: GroupKey; onChange: (v: GroupKey) => void; exclude?: GroupKey }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value as GroupKey)}
        className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        {GROUP_OPTIONS
          .filter(o => !exclude || o.value === 'none' || o.value !== exclude)
          .map(o => <option key={o.value} value={o.value}>{o.label}</option>)
        }
      </select>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.users.title}</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{t.admin.users.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">{t.admin.users.count.replace('{n}', String(filtered.length))}</span>
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); }}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t.admin.users.createUser}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showCreate && (
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t.admin.users.newUserTitle}</h3>
            <button
              onClick={() => { setShowCreate(false); setCreateForm(emptyCreateForm); setCreateError(''); }}
              className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--input-bg)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {createError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.users.fullName}</label>
              <input
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder={t.admin.users.namePlaceholder}
                className="w-full rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.users.email}</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.users.phone}</label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder={t.admin.users.phonePlaceholder}
                className="w-full rounded-lg border border-[var(--input-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t.admin.users.tempPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder={t.admin.users.passwordPlaceholder}
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
              disabled={creating || !createForm.full_name || !createForm.email || createForm.password.length < 8}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {creating ? t.admin.users.creating : t.admin.users.createUser}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateForm(emptyCreateForm); setCreateError(''); }}
              className="rounded-lg border border-[var(--input-border)] px-5 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--input-bg)]"
            >
              {t.common.cancel}
            </button>
            <p className="text-xs text-[var(--muted)]">{t.admin.users.createNote}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={[
            { field: 'all', label: t.admin.users.fieldAll },
            { field: 'full_name', label: t.admin.users.fieldName },
            { field: 'email', label: t.admin.users.fieldEmail },
          ]}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.users.searchPlaceholder}
          className="flex-1 max-w-sm"
        />
        <div className="flex items-center gap-2">
          <GroupSelect
            value={groupBy}
            onChange={v => { setGroupBy(v); setGroupBy2('none'); setCollapsedGroups(new Set()); }}
          />
          {groupBy !== 'none' && (
            <>
              <span className="text-xs text-[var(--muted)]">{t.groupBy.andThen}</span>
              <GroupSelect
                value={groupBy2}
                onChange={v => { setGroupBy2(v); setCollapsedGroups(new Set()); }}
                exclude={groupBy}
              />
            </>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value=""
              disabled={bulkSaving}
              onChange={e => { if (e.target.value) applyBulkRole(e.target.value as UserRole); }}
              className="rounded-lg border border-[var(--input-border)] bg-white px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="">{t.admin.users.bulkChangeRole}</option>
              <option value="external_user">{t.roles.external_user}</option>
              <option value="internal_user">{t.roles.internal_user}</option>
              <option value="admin">{t.roles.admin}</option>
            </select>
            <select
              value=""
              disabled={bulkSaving}
              onChange={e => { if (e.target.value) applyBulkVerification(e.target.value as VerificationStatus); }}
              className="rounded-lg border border-[var(--input-border)] bg-white px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="">{t.admin.users.bulkChangeVerification}</option>
              <option value="verified">{t.status.verified}</option>
              <option value="pending">{t.status.pending}</option>
              <option value="unverified">{t.status.unverified}</option>
              <option value="rejected">{t.status.rejected}</option>
            </select>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.users.deleteConfirm.replace('{n}', String(selected.size))}</span>
                <button onClick={executeBulkDelete} disabled={bulkSaving} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">{t.common.confirm}</button>
                <button onClick={() => setConfirmBulkDelete(false)} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--input-bg)]">{t.common.cancel}</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBulkDelete(true)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">{t.common.delete}</button>
            )}
          </div>
          <button onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-12 text-center text-sm text-[var(--muted)]">{t.admin.users.emptyState}</div>
      ) : grouped ? (
        <div className="space-y-3">
          {grouped.map(({ key: gKey, profiles: gProfiles, subgroups }) => {
            const pId = `p:${gKey}`;
            const isCollapsed = collapsedGroups.has(pId);
            return (
              <div key={gKey} className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                <button
                  onClick={() => toggleCollapse(pId)}
                  className="flex w-full items-center gap-2 border-b border-[var(--card-border)] bg-[var(--background)] px-5 py-3 text-start"
                >
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <span className="text-sm font-semibold text-[var(--foreground)]">{gKey}</span>
                  <span className="mr-auto rounded-full bg-[var(--input-bg)] px-2.5 py-0.5 text-xs text-[var(--muted)]">{gProfiles.length}</span>
                </button>

                {!isCollapsed && (
                  subgroups ? (
                    <div className="divide-y divide-[var(--card-border)]">
                      {subgroups.map(({ key: sKey, profiles: sProfiles }) => {
                        const sId = `s:${gKey}:${sKey}`;
                        const sCollapsed = collapsedGroups.has(sId);
                        return (
                          <div key={sKey}>
                            <button
                              onClick={() => toggleCollapse(sId)}
                              className="flex w-full items-center gap-2 px-5 py-2.5 text-start hover:bg-[var(--input-bg)]/60"
                            >
                              <span className="w-4 shrink-0" />
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${sCollapsed ? '-rotate-90' : ''}`} />
                              <span className="text-xs font-medium text-[var(--foreground)]">{sKey}</span>
                              <span className="mr-auto rounded-full bg-[var(--input-bg)] px-2 py-0.5 text-[10px] text-[var(--muted)]">{sProfiles.length}</span>
                            </button>
                            {!sCollapsed && renderTable(sProfiles, () => toggleGroupSelect(sProfiles))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    renderTable(gProfiles, () => toggleGroupSelect(gProfiles))
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          {renderTable(filtered, toggleSelectAll)}
        </div>
      )}
    </div>
  );
}
