'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { t } = useLocale();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) { router.replace('/auth/signup'); return; }
    inputRefs.current[0]?.focus();
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d) && digit) {
      submitCode(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    if (pasted.length === CODE_LENGTH) submitCode(pasted);
  }

  async function submitCode(code: string) {
    if (!email) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    setLoading(false);
    if (err) {
      setError(t.auth.verifyEmail.errorInvalid);
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } else {
      setVerified(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: 'signup', email });
    setCooldown(RESEND_COOLDOWN);
    setResendMsg(t.auth.verifyEmail.resendSuccess);
    setTimeout(() => setResendMsg(''), 3000);
  }

  if (verified) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.auth.verifyEmail.successTitle}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-[var(--accent)]" strokeWidth={1.8} />
          <h1 className="text-2xl font-bold">{t.auth.verifyEmail.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t.auth.verifyEmail.subtitle}{' '}
            <span className="font-medium text-[var(--foreground)]" dir="ltr">{email}</span>
          </p>
        </div>

        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-3 block text-sm text-[var(--muted)]">{t.auth.verifyEmail.codeLabel}</label>
          <div className="flex justify-center gap-2" onPaste={handlePaste} dir="ltr">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-center text-lg font-bold text-[var(--foreground)] focus:outline-none"
              />
            ))}
          </div>

          <button
            onClick={() => submitCode(digits.join(''))}
            disabled={loading || digits.some((d) => !d)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t.auth.verifyEmail.submitting : t.auth.verifyEmail.submit}
          </button>

          <div className="mt-4 text-center text-sm">
            {resendMsg ? (
              <span className="text-emerald-600">{resendMsg}</span>
            ) : cooldown > 0 ? (
              <span className="text-[var(--muted)]">{t.auth.verifyEmail.resendCooldown.replace('{n}', String(cooldown))}</span>
            ) : (
              <button onClick={handleResend} className="text-[var(--accent-text)] hover:underline">
                {t.auth.verifyEmail.resend}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/auth/signup" className="text-[var(--accent-text)] hover:underline">
            {t.auth.verifyEmail.backToSignup}
          </Link>
        </p>
      </div>
    </div>
  );
}
