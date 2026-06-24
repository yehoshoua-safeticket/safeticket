'use client';

import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple';
}

const colorMap = {
  emerald: { chip: 'bg-emerald-50 text-emerald-700', value: 'text-emerald-700' },
  blue: { chip: 'bg-[var(--accent-soft)] text-[var(--accent-text)]', value: 'text-[var(--foreground)]' },
  yellow: { chip: 'bg-amber-50 text-amber-700', value: 'text-amber-700' },
  red: { chip: 'bg-red-50 text-red-700', value: 'text-red-700' },
  purple: { chip: 'bg-violet-50 text-violet-700', value: 'text-violet-700' },
};

export default function DashboardCard({ title, value, icon: Icon, trend, color = 'blue' }: DashboardCardProps) {
  const c = colorMap[color];
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--card-border)] bg-[var(--surface)] p-5 elev-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="overline text-[var(--muted)]">{title}</p>
          <p className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-bold leading-none ${c.value}`}>{value}</p>
          {trend && <p className="mt-1.5 text-xs text-[var(--muted)]">{trend}</p>}
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${c.chip}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}
