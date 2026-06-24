'use client';

import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-6 py-16 text-center">
      <div className="rounded-xl bg-[var(--input-bg)] p-4">
        <Icon className="h-7 w-7 text-[var(--muted)]" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>}
      {action && (
        <a href={action.href} className="mt-6 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
          {action.label}
        </a>
      )}
    </div>
  );
}
