import type { Metadata } from 'next';

// Staff sign-in lives outside the (public) group on purpose: no navbar, no footer,
// no link from the public site, and kept out of search results.
export const metadata: Metadata = {
  title: 'SafeTicket',
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--background)]">{children}</div>;
}
