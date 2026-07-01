import Navbar from "@/components/layout/Navbar";
import SearchStrip from "@/components/layout/SearchStrip";
import Footer from "@/components/layout/Footer";
import { Suspense, type ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', background: '#ffffff' }}>

      {/* All public content. The stage wallpaper is no longer a fixed full-page
          layer — it now lives only inside the homepage hero section. */}
      <div className="site-anim flex min-h-screen flex-col" style={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
        <Suspense fallback={<div className="sticky top-14 z-40 h-[60px] border-b border-[var(--card-border)] bg-white/80" />}>
          <SearchStrip />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

    </div>
  );
}
