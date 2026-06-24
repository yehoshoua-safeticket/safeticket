'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

export default function LoginPage() {
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t.auth.login.genericError);
      setLoading(false);
      return;
    }

    // Honor a safe internal ?next= redirect (e.g. when bounced from checkout).
    const nextParam = new URLSearchParams(window.location.search).get('next');
    const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'internal_user';
    router.push(safeNext ?? (isAdmin ? '/admin' : '/dashboard'));
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.login.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.login.email}</label>
              <input name="email" type="email" required placeholder="your@email.com" dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.login.password}</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.auth.login.submit}
          </button>
          <div className="mt-4">
            <Link href="/auth/forgot-password" className="text-xs text-[var(--accent-text)] hover:underline">
              {t.auth.login.forgotPassword}
            </Link>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {t.auth.login.noAccount}{' '}<Link href="/auth/signup" className="text-[var(--accent-text)] hover:underline">{t.auth.login.createAccount}</Link>
        </p>
      </div>
    </div>
  );
}
