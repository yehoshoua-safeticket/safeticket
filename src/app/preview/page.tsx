import Link from 'next/link';
import { Ticket } from 'lucide-react';

const variants = [
  {
    id: 'a',
    label: 'Variant A',
    title: 'Immersive Media',
    desc: 'Full-screen concert photography with a deep blue colour-grade. Emotion-first. The venue energy comes through the screen.',
    accent: '#0044cc',
    bg: 'from-[#001e3d] to-[#062b73]',
    tag: 'Dark · Photo-led · Cinematic',
  },
  {
    id: 'b',
    label: 'Variant B',
    title: 'Editorial Typography',
    desc: 'White canvas, oversized type, "100%" as a visual anchor. Confident and authoritative — like a premium financial product.',
    accent: '#0044cc',
    bg: 'from-[#f0f4ff] to-[#e4ecff]',
    tag: 'Light · Type-first · Editorial',
    dark: false,
  },
  {
    id: 'c',
    label: 'Variant C',
    title: 'Product Demo',
    desc: 'Dark navy left panel meets a live product mockup on the right. Shows the escrow flow in motion. Stripe-level product storytelling.',
    accent: '#4d94ff',
    bg: 'from-[#001e3d] to-[#020d1e]',
    tag: 'Split · UI-forward · Fintech',
  },
  {
    id: 'd',
    label: 'Variant D',
    title: 'Generative Abstract',
    desc: 'Zero photography. Animated CSS mesh grid, glowing gradient headline, floating ticket shapes. Pure brand expression.',
    accent: '#60a5fa',
    bg: 'from-[#000a1a] to-[#001233]',
    tag: 'Dark · Motion-first · Futuristic',
  },
];

export default function PreviewIndex() {
  return (
    <div className="min-h-screen bg-[#060d18] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0044cc] to-[#062b73]">
            <Ticket className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-sm font-bold text-white/60">SafeTicket — Design Preview</span>
        </div>

        <h1 className="mb-3 text-4xl font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          4 Homepage Directions
        </h1>
        <p className="mb-12 max-w-xl text-base text-white/50">
          Each variant explores a distinct visual identity. Click to view the full-page prototype.
          One will become the foundation for the entire redesign.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`/preview/${v.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 transition-all duration-200 hover:border-white/20 hover:bg-white/8"
            >
              {/* Gradient swatch */}
              <div className={`h-36 bg-gradient-to-br ${v.bg}`} />

              {/* Label pill on swatch */}
              <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                {v.label}
              </div>

              {/* Tag pill */}
              <div className="absolute right-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium text-white/60 backdrop-blur-sm">
                {v.tag}
              </div>

              <div className="p-5">
                <h2 className="mb-1.5 text-lg font-bold text-white group-hover:text-[#4d94ff] transition-colors">
                  {v.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/55">{v.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#4d94ff] opacity-0 transition-opacity group-hover:opacity-100">
                  Open variant →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          These are visual prototypes — all four share the same Supabase data and i18n system.
        </p>
      </div>
    </div>
  );
}
