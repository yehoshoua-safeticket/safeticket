import type { Metadata } from 'next';

// The staff area sits outside the (public) group on purpose: no navbar, no footer,
// no link from the public site, and kept out of search results. Styling is left to
// the nested layouts — the login door and the tool want different canvases.
export const metadata: Metadata = {
  title: 'SafeTicket',
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
