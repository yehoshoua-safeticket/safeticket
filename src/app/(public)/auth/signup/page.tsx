'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;

    if (password !== confirmPassword) {
      setError(t.auth.signup.errorPasswordMismatch);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.signup.errorPasswordShort);
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(t.auth.signup.errorPasswordWeak);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone || null } },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        verification_status: 'unverified',
        role: 'external_user',
      });
    }

    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.signup.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.auth.signup.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.signup.fullName}</label>
              <input name="fullName" type="text" required placeholder={t.auth.signup.namePlaceholder} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.signup.email}</label>
              <input name="email" type="email" required placeholder="your@email.com" dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.signup.phone}</label>
              <input name="phone" type="tel" placeholder={t.auth.signup.phonePlaceholder} dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.signup.password}</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required placeholder={t.auth.signup.passwordPlaceholder} dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm placeholder-[var(--muted)] focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.signup.passwordConfirm}</label>
              <div className="relative">
                <input name="confirmPassword" type="password" required placeholder={t.auth.signup.passwordConfirmPlaceholder} dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-10 text-sm placeholder-[var(--muted)] focus:outline-none" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.auth.signup.submit}
          </button>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            {t.auth.signup.terms}
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {t.auth.signup.hasAccount}{' '}<Link href="/auth/login" className="text-[var(--accent-text)] hover:underline">{t.auth.signup.login}</Link>
        </p>
      </div>
    </div>
  );
}
