import { useEffect, useRef, type ReactNode } from 'react'
import { fa } from '../lib/fa'

/* ---------- icons (24px grid, 1.8 stroke, same style as the site) ---------- */
const I = ({ children, size = 22 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
export const Icon = {
  dashboard: (s?: number) => <I size={s}><rect x="3.5" y="3.5" width="7" height="8" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="3.5" y="14.5" width="7" height="6" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /></I>,
  courses: (s?: number) => <I size={s}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6" /></I>,
  calendar: (s?: number) => <I size={s}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2" /></I>,
  tasks: (s?: number) => <I size={s}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12l2 2 4-4M9 17h6" /></I>,
  video: (s?: number) => <I size={s}><rect x="3" y="5" width="14" height="14" rx="2.5" /><path d="M17 10l4-2.5v9L17 14" /><path d="M8.5 9.5l4 2.5-4 2.5z" fill="currentColor" /></I>,
  award: (s?: number) => <I size={s}><circle cx="12" cy="9" r="6" /><path d="M8.5 13.8L7 21l5-2.5 5 2.5-1.5-7.2M10 9l1.5 1.5L14.5 7.5" /></I>,
  wallet: (s?: number) => <I size={s}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4" /><rect x="3.5" y="8" width="17" height="12" rx="2.5" /><path d="M16 14h1.5" /></I>,
  support: (s?: number) => <I size={s}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2zM17 18c0 1.7-1.6 2.5-4 2.5" /></I>,
  user: (s?: number) => <I size={s}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></I>,
  bell: (s?: number) => <I size={s}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5zM10 20.5a2 2 0 0 0 4 0" /></I>,
  logout: (s?: number) => <I size={s}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l-4 4 4 4M11 12h10" /></I>,
  home: (s?: number) => <I size={s}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></I>,
  more: (s?: number) => <I size={s}><circle cx="5" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="19" cy="12" r="1.3" fill="currentColor" /></I>,
  clock: (s?: number) => <I size={s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>,
  play: (s?: number) => <I size={s}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></I>,
  live: (s?: number) => <I size={s}><circle cx="12" cy="12" r="2.5" fill="currentColor" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></I>,
  upload: (s?: number) => <I size={s}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></I>,
  check: (s?: number) => <I size={s}><path d="M5 12.5l4.5 4.5L19 7.5" /></I>,
  chart: (s?: number) => <I size={s}><path d="M3 21h18M6 17v-5M11 17V8M16 17v-7M21 17V5" /></I>,
  fire: (s?: number) => <I size={s}><path d="M12 21c4 0 7-2.8 7-6.8 0-3.3-2.2-5.2-3.6-7.7-.4 1.9-1.4 3.2-2.9 3.9C12.9 7 11.4 4.4 9 3c.4 3.4-1.5 5.4-3 7.4A7.2 7.2 0 0 0 5 14.2C5 18.2 8 21 12 21z" /></I>,
  print: (s?: number) => <I size={s}><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" rx="1" /></I>,
  receipt: (s?: number) => <I size={s}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" /></I>,
  plus: (s?: number) => <I size={s}><path d="M12 5v14M5 12h14" /></I>,
  close: (s?: number) => <I size={s}><path d="M6 6l12 12M18 6L6 18" /></I>,
  lock: (s?: number) => <I size={s}><rect x="5" y="10" width="14" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></I>,
  news: (s?: number) => <I size={s}><path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5" /></I>,
  chat: (s?: number) => <I size={s}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z" /><path d="M8 9h8M8 12.5h5" /></I>,
  send: (s?: number) => <I size={s}><path d="M20 4L3 11l6.5 2.5L12 20zM9.5 13.5L20 4" /></I>,
  users: (s?: number) => <I size={s}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2" /></I>,
  checklist: (s?: number) => <I size={s}><path d="M4 6l1.5 1.5L8.5 4.5M4 12l1.5 1.5 3-3M4 18l1.5 1.5 3-3M12 6h8M12 12h8M12 18h8" /></I>,
  megaphone: (s?: number) => <I size={s}><path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6M8 15l1 5h2.5l-1-5" /></I>,
  pen: (s?: number) => <I size={s}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" /></I>,
  chevronLeft: (s?: number) => <I size={s}><path d="M15 6l-6 6 6 6" /></I>,
  chevronRight: (s?: number) => <I size={s}><path d="M9 6l6 6-6 6" /></I>,
}

/** Circular progress (0..1) with a centred label. */
export function Ring({ value, size = 64, stroke = 7, label }: { value: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <span className="p-ring" style={{ width: size, height: size }} role="img" aria-label={`پیشرفت ${fa(Math.round(value * 100))}٪`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="p-ring-bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="p-ring-fg" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <b>{label ?? `${fa(Math.round(value * 100))}٪`}</b>
    </span>
  )
}

export const Bar = ({ value, label }: { value: number; label: string }) => (
  <span className="p-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
    <i style={{ width: `${Math.round(value * 100)}%` }} />
  </span>
)

export const Chip = ({ tone, children }: { tone: 'lime' | 'navy' | 'warn' | 'muted' | 'ok' | 'sky'; children: ReactNode }) => <span className={`p-chip p-chip-${tone}`}>{children}</span>

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="p-empty">{icon}<b>{title}</b><p>{text}</p>{action}</div>
}

/** Modal on the native <dialog>: focus trap, Escape and backdrop are handled by the browser. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={`p-modal${wide ? ' p-modal-wide' : ''}`} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }} aria-label={title}>
      <div className="p-modal-in">
        <header><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="بستن">{Icon.close(20)}</button></header>
        {children}
      </div>
    </dialog>
  )
}

/** First letters of the first two words, for avatar placeholders. */
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('‌')
