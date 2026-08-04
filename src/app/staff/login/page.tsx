'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

export default function StaffLoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // The username -> account lookup happens server-side, so no staff email is
    // ever exposed to the browser.
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error === 'not_configured' ? t.auth.staffLogin.genericError : t.auth.staffLogin.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push('/staff');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.staffLogin.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.staffLogin.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.staffLogin.username}</label>
              <input name="username" type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.login.password}</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm placeholder-[var(--muted)] focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.auth.staffLogin.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
