'use client';

import { ShieldCheck, ShieldAlert, Clock, ShieldX } from 'lucide-react';
import type { VerificationStatus } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

interface VerificationBannerProps {
  status: VerificationStatus;
}

const config: Record<VerificationStatus, { icon: typeof ShieldCheck; bg: string; text: string }> = {
  verified: { icon: ShieldCheck, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  pending: { icon: Clock, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  unverified: { icon: ShieldAlert, bg: 'bg-stone-50 border-stone-200', text: 'text-stone-600' },
  rejected: { icon: ShieldX, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export default function VerificationBanner({ status }: VerificationBannerProps) {
  const { t } = useLocale();
  const { icon: Icon, bg, text } = config[status];

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${bg}`}>
      <Icon className={`h-5 w-5 shrink-0 ${text}`} />
      <p className={`text-sm ${text}`}>{t.verificationBanner[status]}</p>
    </div>
  );
}
