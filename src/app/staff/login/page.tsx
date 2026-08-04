'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

const STAFF_ROLES = ['admin', 'internal_user'];

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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t.auth.staffLogin.genericError);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // A customer account authenticating here gets signed straight back out — this
    // door only opens onto the management tool.
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      await supabase.auth.signOut();
      setError(t.auth.staffLogin.notStaff);
      setLoading(false);
      return;
    }

    router.push('/admin');
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
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.auth.login.email}</label>
              <input name="email" type="email" required placeholder="your@email.com" dir="ltr" className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm placeholder-[var(--muted)] focus:outline-none" />
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
