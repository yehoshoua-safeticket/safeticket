import { requireAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import type { CSSProperties } from 'react';

// Admin runs the standard LIGHT palette on a soft-grey canvas so the white cards
// and tables read clearly. Only --background is overridden; every other token is
// inherited from :root (white surfaces, Azure accent, dark ink text).
const adminVars: CSSProperties = { '--background': '#f4f6fb' } as CSSProperties;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    if (auth.error === 'Not authenticated') redirect('/auth/login');
    redirect('/dashboard');
  }

  return (
    <div style={{ position: 'relative', background: '#f4f6fb', minHeight: '100vh', ...adminVars }}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
