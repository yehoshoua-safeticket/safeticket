'use client';

import { AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Dispute } from '@/types/database';

interface DisputeCardProps {
  dispute: Dispute;
}

export default function DisputeCard({ dispute }: DisputeCardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="font-semibold">סכסוך #{dispute.id.slice(-4)}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">הזמנה: #{dispute.order_id.slice(-4)}</p>
          </div>
        </div>
        <StatusBadge status={dispute.status} />
      </div>
      <div className="mt-3">
        <p className="text-sm text-[var(--muted)]">{dispute.reason}</p>
      </div>
      {dispute.admin_resolution && (
        <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] p-3">
          <p className="text-xs font-medium text-[var(--muted)]">החלטת מנהל:</p>
          <p className="mt-0.5 text-sm">{dispute.admin_resolution}</p>
        </div>
      )}
      <div className="mt-3 text-xs text-[var(--muted)]">
        {new Date(dispute.created_at).toLocaleDateString('he-IL')}
      </div>
    </div>
  );
}
