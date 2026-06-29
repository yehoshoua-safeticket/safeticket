import Navbar from "@/components/layout/Navbar";
import SearchStrip from "@/components/layout/SearchStrip";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', background: '#ffffff' }}>

      {/* All public content. The stage wallpaper is no longer a fixed full-page
          layer — it now lives only inside the homepage hero section. */}
      <div className="site-anim flex min-h-screen flex-col" style={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
        <SearchStrip />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

    </div>
  );
}
