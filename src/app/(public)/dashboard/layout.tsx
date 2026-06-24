import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AccountSidebar from '@/components/layout/AccountSidebar';
import type { UserRole, VerificationStatus } from '@/types/database';
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, verification_status')
    .eq('id', user.id)
    .single();

  const role = (profile?.role ?? 'external_user') as UserRole;

  if (role === 'admin' || role === 'internal_user') redirect('/admin');

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    '';
  const verificationStatus = (profile?.verification_status ?? 'unverified') as VerificationStatus;

  return (
    <div style={{ position: 'relative', background: '#09152f', minHeight: '100vh' }}>
      {/* Fixed stage background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(140deg, rgba(9,21,47,0.88) 0%, rgba(26,85,227,0.38) 45%, rgba(9,21,47,0.92) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', ...darkVars }}>
        <div className="no-anim flex min-h-screen flex-col lg:flex-row-reverse">
          <AccountSidebar
            role={role}
            fullName={fullName}
            email={user.email ?? ''}
            verificationStatus={verificationStatus}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
