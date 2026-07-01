// SafeTicket wordmark (SVG). Black by default; pass `white` to flip it white on
// dark chrome (brightness(0) forces solid black, invert(1) → solid white).
export default function Logo({ className = '', white = false }: { className?: string; white?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logos/safeticket.svg"
      alt="SafeTicket"
      draggable={false}
      className={className}
      style={white ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}
