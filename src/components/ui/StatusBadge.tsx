'use client';

import { useLocale } from '@/i18n/LocaleProvider';
import type { Translations } from '@/i18n/he';

// Light (blanc cassé) tinted chips: soft fill + dark text per semantic group.
const SUCCESS = { bg: 'bg-emerald-50', text: 'text-emerald-700' };
const WARNING = { bg: 'bg-amber-50', text: 'text-amber-700' };
const DANGER = { bg: 'bg-red-50', text: 'text-red-700' };
const INFO = { bg: 'bg-blue-50', text: 'text-blue-700' };
const NEUTRAL = { bg: 'bg-stone-100', text: 'text-stone-600' };

const statusStyles: Record<string, { bg: string; text: string }> = {
  verified: SUCCESS, active: SUCCESS, paid: SUCCESS, released: INFO, confirmed: SUCCESS,
  completed: INFO, clear: SUCCESS, done: SUCCESS, replied: SUCCESS,
  pending: WARNING, pending_review: WARNING, under_review: WARNING, held: WARNING,
  pending_release: WARNING, todo: INFO, open_status: WARNING, flagged: WARNING,
  unverified: NEUTRAL, draft: NEUTRAL, expired: NEUTRAL, cancelled: NEUTRAL,
  canceled: NEUTRAL, closed: NEUTRAL,
  sold: INFO, refunded: INFO, resolved_buyer: INFO, resolved_seller: INFO,
  rejected: DANGER, blocked: DANGER, failed: DANGER, disputed: DANGER, open: DANGER,
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, customLabel, size = 'sm' }: StatusBadgeProps) {
  const { t } = useLocale();
  const style = statusStyles[status] || NEUTRAL;
  const label = customLabel ?? (t.status[status as keyof Translations['status']] || status);

  return (
    <span
      className={`inline-flex items-center rounded-[5px] border border-current/25 font-semibold tracking-wide ${style.bg} ${style.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[13px]'
      }`}
    >
      {label}
    </span>
  );
}
