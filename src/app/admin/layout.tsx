import { requireAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import type { CSSProperties } from 'react';

const darkVars: CSSProperties = {
  '--background':        '#09152f',
  '--surface':           '#0d1d45',
  '--surface-2':         '#121f3d',
  '--card':              '#0d1d45',
  '--card-border':       'rgba(255,255,255,0.08)',
  '--card-border-soft':  'rgba(255,255,255,0.05)',
  '--foreground':        '#ffffff',
  '--ink':               '#ffffff',
  '--muted':             'rgba(255,255,255,0.50)',
  '--accent':            '#1a55e3',
  '--accent-hover':      '#1548cc',
  '--accent-text':       '#5599ff',
  '--accent-soft':       'rgba(26,85,227,0.20)',
  '--accent-2':          '#0d1d45',
  '--accent-2-text':     '#5599ff',
  '--input-bg':          '#121f3d',
  '--input-border':      'rgba(255,255,255,0.15)',
  '--ring':              '#1a55e3',
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
    <div style={{ position: 'relative', background: '#09152f', minHeight: '100vh' }}>
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', ...darkVars }}>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
