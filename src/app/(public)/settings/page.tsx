'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

export default function SettingsPage() {
  const { t } = useLocale();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasActiveDeals, setHasActiveDeals] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? '');
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (profile) setPhone(profile.phone ?? '');
      const { count } = await supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).in('status', ['active', 'pending_review']);
      setHasActiveDeals((count ?? 0) > 0);
    });
  }, []);

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setLoadingContact(true);
    setContactMsg(null);
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    setLoadingContact(false);
    if (!res.ok) {
      const d = await res.json();
      setContactMsg({ text: d.error || 'Error', ok: false });
    } else {
      setContactMsg({ text: t.settings.successContact, ok: true });
      const supabase = createClient();
      await supabase.auth.refreshSession();
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) { setPasswordMsg({ text: t.settings.passwordMismatch, ok: false }); return; }
    if (newPassword.length < 8) { setPasswordMsg({ text: t.settings.passwordShort, ok: false }); return; }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) { setPasswordMsg({ text: t.settings.passwordWeak, ok: false }); return; }
    setLoadingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);
    if (error) { setPasswordMsg({ text: error.message, ok: false }); return; }
    setPasswordMsg({ text: t.settings.successPassword, ok: true });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  }

  async function handleDeleteAccount() {
    if (!confirm(t.settings.deleteConfirm)) return;
    setLoadingDelete(true);
    setDeleteError('');
    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const d = await res.json();
      setDeleteError(d.error || 'Error');
      setLoadingDelete(false);
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  }

  const inputClass = 'w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.settings.subtitle}</p>
      </div>

      <div className="space-y-8">
        {/* Contact details */}
        <form onSubmit={handleSaveContact} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.settings.sectionContact}</h2>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.settings.labelEmail}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-[var(--muted)]">{t.settings.emailNote}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.settings.labelPhone}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          {contactMsg && (
            <div className={`rounded-lg px-4 py-2.5 text-sm ${contactMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{contactMsg.text}</div>
          )}
          <button type="submit" disabled={loadingContact || !userId} className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {loadingContact && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.settings.saveContact}
          </button>
        </form>

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.settings.sectionPassword}</h2>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.settings.labelNewPassword}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.settings.labelConfirmPassword}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          {passwordMsg && (
            <div className={`rounded-lg px-4 py-2.5 text-sm ${passwordMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{passwordMsg.text}</div>
          )}
          <button type="submit" disabled={loadingPassword || !newPassword} className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {loadingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.settings.savePassword}
          </button>
        </form>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-red-700">{t.settings.sectionDanger}</h2>
          <p className="text-sm text-red-600">{t.settings.deleteDesc}</p>
          {deleteError && <div className="rounded-lg bg-white px-4 py-2.5 text-sm text-red-700">{deleteError}</div>}
          <button
            onClick={handleDeleteAccount}
            disabled={hasActiveDeals || loadingDelete || !userId}
            title={hasActiveDeals ? t.settings.deleteDisabled : undefined}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingDelete && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.settings.deleteButton}
          </button>
          {hasActiveDeals && <p className="text-xs text-red-500">{t.settings.deleteDisabled}</p>}
        </div>
      </div>
    </div>
  );
}
