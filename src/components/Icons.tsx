import Sprig from './Sprig'
import type { SVGProps } from 'react'
type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })

export const ArrowLeft = (p: P) => <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
export const ChevronRight = (p: P) => <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
export const ChevronLeft = (p: P) => <svg {...base(p)}><path d="M15 6l-6 6 6 6" /></svg>
export const Sun = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
export const Moon = (p: P) => <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
export const User = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></svg>
export const Menu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
export const Close = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
export const Plus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
export const Phone = (p: P) => <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
export const Mail = (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
export const Clock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
export const Users = (p: P) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.6 3 2.2 3.5 5.2" /></svg>
export const Star = (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
export const Bars = (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><rect x="3" y="12" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="12" rx="1" /><rect x="17" y="4" width="4" height="16" rx="1" /></svg>
export const Quote = (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="M4 18v-5.5C4 8.5 6.2 6 10 5.5l.5 1.8C8.600 7.900 7.700 9 7.600 10.500H10V18H4zm10 0v-5.500C14 8.500 16.200 6 20 5.500l.5 1.800c-1.900.600-2.800 1.700-2.900 3.200H20V18h-6z" /></svg>
export const Play = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M10 8.500l6 3.500-6 3.500z" fill="var(--bg)" stroke="none" /></svg>
export const Mentors = (p: P) => <svg {...base(p)}><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.200" /><circle cx="19" cy="10" r="2.200" /><path d="M7 19c0-3 2.200-5 5-5s5 2 5 5zM1.500 18c0-2 1.300-3.500 3.500-3.500M22.500 18c0-2-1.300-3.500-3.500-3.500" /></svg>
export const Chart = (p: P) => <svg {...base(p)}><path d="M3 21h18M5 17v-4M10 17V9M15 17v-6M20 17V6M4 9l5-4 4 3 6-5" /></svg>
export const Headset = (p: P) => <svg {...base(p)}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.500" /><rect x="17" y="13" width="4" height="6" rx="1.500" /><path d="M19 19c0 1.500-1.500 2-4 2" /></svg>
export const Clipboard = (p: P) => <svg {...base(p)}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 14l2 2 4-4" /></svg>
export const Screen = (p: P) => <svg {...base(p)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4M10.500 8.500l4 2-4 2z" /></svg>
export const Chat = (p: P) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.500" /></svg>
export const Trophy = (p: P) => <svg {...base(p)}><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6" /></svg>
export const Teacher = (p: P) => <svg {...base(p)}><circle cx="12" cy="7" r="3.500" /><path d="M5 21c0-4 3-6.500 7-6.500s7 2.500 7 6.500zM16.500 11l4 1.500" /></svg>

export const Leaf = ({ className }: { className?: string }) => <Sprig className={className} />

export const Spark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
    <path d="M6 30l12-6M10 12l10 10M26 4l-2 14" />
  </svg>
)

export const Flag = ({ code }: { code: 'uk' | 'de' | 'fr' | 'it' | 'sa' | 'tr' }) => {
  const s = { width: 24, height: 24 }
  if (code === 'tr') return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#e30a17" /><circle cx="10" cy="12" r="5.2" fill="#fff" /><circle cx="11.3" cy="12" r="4.2" fill="#e30a17" /><path d="M15.6 12l2.9-1-1.8 2.5v-3l1.8 2.5z" fill="#fff" /></svg>
  if (code === 'sa') return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1a7f45" /><path d="M6 10.5h12M7 13.5h9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /><path d="M8 16.5h8" stroke="#fff" strokeWidth="1" /></svg>
  if (code === 'de') return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><clipPath id="c-de"><circle cx="12" cy="12" r="12" /></clipPath><g clipPath="url(#c-de)"><rect width="24" height="8" fill="#222" /><rect y="8" width="24" height="8" fill="#d62d2d" /><rect y="16" width="24" height="8" fill="#f5c62e" /></g></svg>
  if (code === 'fr') return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><clipPath id="c-fr"><circle cx="12" cy="12" r="12" /></clipPath><g clipPath="url(#c-fr)"><rect width="8" height="24" fill="#2f4fa8" /><rect x="8" width="8" height="24" fill="#f4f4f4" /><rect x="16" width="8" height="24" fill="#d62d2d" /></g></svg>
  if (code === 'it') return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><clipPath id="c-it"><circle cx="12" cy="12" r="12" /></clipPath><g clipPath="url(#c-it)"><rect width="8" height="24" fill="#2e9b57" /><rect x="8" width="8" height="24" fill="#f4f4f4" /><rect x="16" width="8" height="24" fill="#d62d2d" /></g></svg>
  return <svg {...s} viewBox="0 0 24 24" aria-hidden="true"><clipPath id="c-uk"><circle cx="12" cy="12" r="12" /></clipPath><g clipPath="url(#c-uk)"><rect width="24" height="24" fill="#2b3f8f" /><path d="M0 0l24 24M24 0L0 24" stroke="#f4f4f4" strokeWidth="5" /><path d="M0 0l24 24M24 0L0 24" stroke="#d62d2d" strokeWidth="2" /><path d="M12 0v24M0 12h24" stroke="#f4f4f4" strokeWidth="8" /><path d="M12 0v24M0 12h24" stroke="#d62d2d" strokeWidth="4.500" /></g></svg>
}
