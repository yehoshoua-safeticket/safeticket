// Animated burger: three stepped bars (a staircase) that reorganise into an X
// when `open`. Styling + transitions live in globals.css (.menu-toggle).
export default function MenuToggle({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <span className={`menu-toggle ${open ? 'is-open' : ''} ${className}`} aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}
