import Navbar from "@/components/layout/Navbar";
import SearchStrip from "@/components/layout/SearchStrip";
import Footer from "@/components/layout/Footer";
import type { ReactNode, CSSProperties } from "react";

// Logo-derived palette:
//   Midnight #09152f · Navy #0d1d45 · Blue #1a55e3 · Bright #2a72ff
const darkVars: CSSProperties = {
  '--background':        'transparent',
  '--surface':           'rgba(255,255,255,0.06)',
  '--surface-2':         'rgba(255,255,255,0.10)',
  '--card':              'rgba(255,255,255,0.08)',
  '--card-border':       'rgba(255,255,255,0.14)',
  '--card-border-soft':  'rgba(255,255,255,0.07)',
  '--foreground':        '#ffffff',
  '--ink':               '#ffffff',
  '--muted':             'rgba(255,255,255,0.52)',
  '--accent':            '#1a55e3',   // logo blue
  '--accent-hover':      '#1548cc',
  '--accent-text':       '#5599ff',   // lighter for dark-bg legibility
  '--accent-soft':       'rgba(26,85,227,0.25)',
  '--accent-2':          '#0d1d45',   // logo navy
  '--accent-2-text':     '#5599ff',
  '--input-bg':          'rgba(255,255,255,0.08)',
  '--input-border':      'rgba(255,255,255,0.20)',
  '--ring':              '#1a55e3',
} as CSSProperties;

// Overlay uses the exact logo blue (#1a55e3 = rgba(26,85,227))
// so background and brand feel intrinsically connected.
const OVERLAY = 'linear-gradient(140deg, rgba(9,21,47,0.85) 0%, rgba(26,85,227,0.42) 45%, rgba(9,21,47,0.88) 100%)';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', background: '#09152f' }}>

      {/* Fixed stage background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
      {/* Logo-blue colour-grade overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: OVERLAY }} />

      {/* All public content */}
      <div className="site-anim flex min-h-screen flex-col" style={{ position: 'relative', zIndex: 2, ...darkVars }}>
        <Navbar />
        <SearchStrip />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

    </div>
  );
}
