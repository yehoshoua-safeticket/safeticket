'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.forgotPassword.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.forgotPassword.subtitle}</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold">{t.auth.forgotPassword.successTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.forgotPassword.successMessage.replace('{email}', email)}</p>
            <Link href="/auth/login" className="mt-6 inline-block text-sm text-[var(--accent-text)] hover:underline">{t.auth.forgotPassword.backToLogin}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.forgotPassword.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t.auth.forgotPassword.submit}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/auth/login" className="text-[var(--accent-text)] hover:underline">{t.auth.forgotPassword.backToLogin}</Link>
        </p>
      </div>
    </div>
  );
}
