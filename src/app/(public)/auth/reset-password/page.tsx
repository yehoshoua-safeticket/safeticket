'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [status, setStatus] = useState<'verifying' | 'ready' | 'invalid' | 'done'>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    // The recovery link arrives either as a PKCE ?code= (needs exchange) or as a
    // hash fragment that supabase-js auto-detects, firing PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStatus('ready');
    });

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) { setStatus('invalid'); return; }
        setStatus('ready');
        return;
      }
      // Fall back to checking for an existing (recovery) session.
      const { data: { session } } = await supabase.auth.getSession();
      setStatus(session ? 'ready' : 'invalid');
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t.auth.resetPassword.errorMismatch); return; }
    if (password.length < 8) { setError(t.auth.resetPassword.errorShort); return; }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { setError(t.auth.resetPassword.errorWeak); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStatus('done');
  }

  const inputClass = 'w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm placeholder-[var(--muted)] focus:outline-none';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.resetPassword.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.resetPassword.subtitle}</p>
        </div>

        {status === 'verifying' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.auth.resetPassword.verifying}
          </div>
        )}

        {status === 'invalid' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700">{t.auth.resetPassword.invalidLink}</p>
            <Link href="/auth/forgot-password" className="mt-6 inline-block text-sm text-[var(--accent-text)] hover:underline">{t.auth.forgotPassword.title}</Link>
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold">{t.auth.resetPassword.successTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.resetPassword.successMessage}</p>
            <Link href="/auth/login" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white">{t.auth.resetPassword.goToLogin}</Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.resetPassword.newPassword}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={inputClass} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.resetPassword.confirmPassword}</label>
                <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t.auth.resetPassword.submitting : t.auth.resetPassword.submit}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/auth/login" className="text-[var(--accent-text)] hover:underline">{t.auth.resetPassword.backToLogin}</Link>
        </p>
      </div>
    </div>
  );
}
