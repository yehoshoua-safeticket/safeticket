import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AccountSidebar from '@/components/layout/AccountSidebar';
import type { UserRole, VerificationStatus } from '@/types/database';

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
    <div style={{ position: 'relative', background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh' }}>
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
