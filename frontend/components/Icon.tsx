import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, strokeWidth = 1.5, ...rest }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export function IconMenu(p: Props)   { return <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16"/></svg>; }
export function IconClose(p: Props)  { return <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18"/></svg>; }
export function IconCheck(p: Props)  { return <svg {...base(p)}><path d="M5 12l5 5L20 7"/></svg>; }
export function IconPlus(p: Props)   { return <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>; }
export function IconMinus(p: Props)  { return <svg {...base(p)}><path d="M5 12h14"/></svg>; }
export function IconArrow(p: Props)  { return <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
export function IconUp(p: Props)     { return <svg {...base(p)}><path d="M12 19V5M6 11l6-6 6 6"/></svg>; }
export function IconSearch(p: Props) { return <svg {...base(p)}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>; }
export function IconImage(p: Props)  { return <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-5 5 5 3-3 3 3"/></svg>; }
export function IconLock(p: Props)   { return <svg {...base(p)}><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>; }
export function IconWarn(p: Props)   { return <svg {...base(p)}><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>; }
export function IconCircle(p: Props) { return <svg {...base(p)}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>; }
export function IconClock(p: Props)  { return <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>; }
export function IconUpload(p: Props) { return <svg {...base(p)}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>; }
export function IconCopy(p: Props)   { return <svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>; }
export function IconGlobe(p: Props)  { return <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 0 1 0 18"/><path d="M12 3a13 13 0 0 0 0 18"/></svg>; }
export function IconChevron(p: Props){ return <svg {...base(p)}><path d="M6 9l6 6 6-6"/></svg>; }
