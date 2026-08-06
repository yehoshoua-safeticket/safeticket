import { redirect } from 'next/navigation';

// Legacy routes — the customer area moved from /dashboard to /account.
// Two of its pages were renamed at the same time: they named the role the
// visitor was playing rather than what the page actually lists.
const RENAMED: Record<string, string> = { buyer: 'orders', seller: 'listings' };

export default async function DashboardRedirect({ params }: { params: Promise<{ rest?: string[] }> }) {
  const { rest = [] } = await params;
  const [head, ...tail] = rest;
  const segments = head ? [RENAMED[head] ?? head, ...tail] : [];
  redirect(['/account', ...segments].join('/'));
}
