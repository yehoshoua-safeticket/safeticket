'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import type { Profile, UserRole } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

export default function InternalUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('internal_user');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'internal_user', label: t.roles.internal_user },
    { value: 'admin', label: t.roles.admin },
  ];

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? '');
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        const p = data as Profile;
        setProfile(p);
        setFullName(p.full_name);
        setEmail(p.email);
        setPhone(p.phone || '');
        setRole(p.role);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, full_name: fullName, email, phone, role }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.admin.userDetail.errorSave);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (id === currentUserId) await createClient().auth.refreshSession();
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.admin.userDetail.errorDelete);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      router.push('/admin/internal_users');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/internal_users')}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
        >
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{profile?.full_name || '...'}</h1>
          <p className="text-sm text-[var(--muted)]">{t.admin.userDetail.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {id !== currentUserId && (
            confirmDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-sm text-red-600">{t.admin.userDetail.deleteConfirm}</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? t.common.deleting : t.common.confirm}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-[var(--input-border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--input-bg)]"
                >
                  {t.common.cancel}
                </button>
              </span>
            ) : (
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saved ? t.common.saved : saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.userDetail.loading}</div>
      ) : !profile ? (
        <div className="py-12 text-center text-sm text-red-600">{t.admin.userDetail.notFound}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="divide-y divide-[var(--card-border)]">
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.userDetail.fieldFullName}</span>
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {profile.id === currentUserId && (
                  <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-text)]">{t.common.you}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.userDetail.fieldEmail}</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="flex-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.userDetail.fieldPhone}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="flex-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.userDetail.fieldJoined}</span>
              <span className="text-sm text-[var(--foreground)]">
                {new Date(profile.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.userDetail.fieldRole}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
