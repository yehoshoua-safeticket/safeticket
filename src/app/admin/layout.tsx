import { requireAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import type { CSSProperties } from 'react';

// Admin runs a dark scope (Ticketmaster "Backstage" tooling) — Black Pearl + Azure.
const darkVars: CSSProperties = {
  '--background':        '#1F262D',
  '--surface':           '#2a333c',
  '--surface-2':         '#333d47',
  '--card':              '#2a333c',
  '--card-border':       'rgba(255,255,255,0.10)',
  '--card-border-soft':  'rgba(255,255,255,0.06)',
  '--foreground':        '#ffffff',
  '--ink':               '#ffffff',
  '--muted':             'rgba(255,255,255,0.55)',
  '--accent':            '#026CDF',
  '--accent-hover':      '#0257B4',
  '--accent-text':       '#4191E7',
  '--accent-soft':       'rgba(2,108,223,0.20)',
  '--accent-2':          '#00E0C7',
  '--accent-2-text':     '#4191E7',
  '--input-bg':          '#333d47',
  '--input-border':      'rgba(255,255,255,0.15)',
  '--ring':              '#026CDF',
  '--danger':            '#f87171',
  '--success':           '#4ade80',
  '--warning':           '#fbbf24',
} as CSSProperties;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    if (auth.error === 'Not authenticated') redirect('/auth/login');
    redirect('/dashboard');
  }

  return (
    <div style={{ position: 'relative', background: '#1F262D', minHeight: '100vh' }}>
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', ...darkVars }}>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
