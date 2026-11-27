// Building blocks shared by the owner, support and supervisor dashboards (and the "my account" page of every panel).
import { useEffect, useState, type FormEvent } from 'react'
import { fa } from '../lib/fa'
import { formatDay } from '../lib/jalali'
import { Chip, Icon, Modal } from '../panel/ui'
import { api, authApi, type Audience, type StaffRole } from '../auth/client'

export const ROLE_LABEL: Record<StaffRole, string> = { owner: 'مالک', support: 'پشتیبانی', supervisor: 'سوپروایزر', reception: 'پذیرش', teacher: 'استاد' }
const ROLE_TONE: Record<StaffRole, 'navy' | 'lime' | 'sky' | 'ok' | 'muted'> = { owner: 'navy', support: 'lime', supervisor: 'sky', reception: 'ok', teacher: 'muted' }
export const RoleChip = ({ role }: { role: StaffRole }) => <Chip tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Chip>
export const when = (iso: string | null) => (iso ? formatDay(new Date(iso)) : '—')

export type Row = {
  kind: 'staff' | 'member'; id: number; name: string; username: string; phone: string | null; role?: StaffRole
  active: boolean; locked: boolean; lastLoginAt: string | null; createdAt: string; phoneVerified?: boolean; passwordSet?: boolean
}
export type Overview = {
  members: { total: number; active: number; newThisWeek: number; phoneVerified: number; locked: number }
  staff: Record<StaffRole, number>; staffLocked: number; otpEnabled: boolean
  activity: { id: number; summary: string; at: string; when: string }[]; manageableRoles: StaffRole[]; contentHubUrl: string
}

/** Strong random password suggestion (shown once to whoever creates/resets the account). */
export function suggestPassword() {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = new Uint32Array(14)
  crypto.getRandomValues(b)
  return Array.from(b, (n) => a[n % a.length]).join('').replace(/(.{4})(.{5})(.{5})/, '$1-$2-$3')
}

export function useLoad<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setError('')
    void api<T>(url).then((r) => { if (!live) return; if (r.ok) setData(r.data); else setError(r.message) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps])
  return { data, error, reload: () => setTick((t) => t + 1) }
}

export function StatusChips({ row }: { row: Row }) {
  return (
    <span className="a-status">
      {row.active ? <Chip tone="ok">فعال</Chip> : <Chip tone="muted">غیرفعال</Chip>}
      {row.locked && <Chip tone="warn">{Icon.lock(14)} قفل موقت</Chip>}
    </span>
  )
}

/** Change-password card, used in every panel's account page. */
export function ChangePassword({ aud, role, passwordSet = true }: { aud: Audience; role?: StaffRole; passwordSet?: boolean }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (f.next.length < 10) return setMsg({ ok: false, text: 'رمز تازه باید دست‌کم ۱۰ نویسه باشد.' })
    if (f.next !== f.confirm) return setMsg({ ok: false, text: 'تکرار رمز تازه با خودش یکی نیست.' })
    setBusy(true)
    const r = await authApi.password(aud, f.current, f.next, role)
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: r.message })
    setF({ current: '', next: '', confirm: '' })
    setMsg({ ok: true, text: 'رمز عبور تغییر کرد. همهٔ دستگاه‌های دیگر از حساب خارج شدند.' })
  }
  return (
    <section className="p-card">
      <header className="p-card-head"><h2>{passwordSet ? 'تغییر رمز عبور' : 'تعیین رمز عبور'}</h2></header>
      {!passwordSet && <p className="p-muted">حسابتان با کد پیامکی ساخته شده است. با تعیین رمز، با نام کاربری هم می‌توانید وارد شوید.</p>}
      <form className="p-form" onSubmit={onSubmit} noValidate>
        <div className="p-form-grid">
          {passwordSet && <label className="p-field"><span>رمز فعلی</span><input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" dir="ltr" className="ltr-in" maxLength={128} /></label>}
          <label className="p-field"><span>رمز تازه</span><input type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" dir="ltr" className="ltr-in" maxLength={128} aria-describedby="pw-rule" /></label>
          <label className="p-field"><span>تکرار رمز تازه</span><input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" dir="ltr" className="ltr-in" maxLength={128} /></label>
        </div>
        <small id="pw-rule" className="p-muted">دست‌کم ۱۰ نویسه. رمزهای ساده مثل ۱۲۳۴۵۶۷۸۹۰ پذیرفته نمی‌شوند.</small>
        {msg && <p className={msg.ok ? 'ok' : 'err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
        <div className="p-btn-row"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیرهٔ رمز'}</button></div>
      </form>
    </section>
  )
}

/** Shows a password exactly once after it was created/reset, with a copy button. */
export function OneTimeSecret({ value, onDone }: { value: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="a-secret">
      <p>این رمز فقط همین یک بار نمایش داده می‌شود. آن را حضوری یا از راه امن به صاحب حساب بدهید و از او بخواهید بعد از ورود عوضش کند.</p>
      <code dir="ltr">{value}</code>
      <div className="p-btn-row">
        <button type="button" className="btn btn-ghost" onClick={() => { void navigator.clipboard?.writeText(value).then(() => setCopied(true)) }}>{copied ? 'کپی شد' : 'کپی رمز'}</button>
        <button type="button" className="btn btn-primary" onClick={onDone}>تمام شد</button>
      </div>
    </div>
  )
}

type ActionKind = 'activate' | 'deactivate' | 'unlock' | 'signout' | 'password' | 'role'
/** "Manage" button + one dialog with every action for an account (staff or member). All checks are repeated on the server. */
export function RowActions({ row, roles, self, onChanged }: { row: Row; roles: StaffRole[]; self?: boolean; onChanged: (r: Row) => void }) {
  const [view, setView] = useState<null | 'menu' | 'password' | 'role' | 'confirm'>(null)
  const [pending, setPending] = useState<ActionKind | null>(null)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  const [secret, setSecret] = useState('')
  const [role, setRole] = useState<StaffRole>(row.role ?? 'teacher')
  const path = `/api/auth/admin/${row.kind === 'staff' ? 'staff' : 'members'}/${row.id}`
  const open = (v: typeof view) => { setErr(''); setDone(''); setSecret(''); setView(v) }
  const run = async (action: ActionKind, extra: Record<string, unknown> = {}, message = '') => {
    setErr(''); setDone(''); setPending(action)
    const r = await api<{ user: Row }>(path, { action, ...extra })
    setPending(null)
    if (!r.ok) { setErr(r.message); return false }
    onChanged({ ...r.data.user, kind: row.kind })
    if (message) setDone(message)
    return true
  }
  const reset = async () => { const pw = suggestPassword(); if (await run('password', { password: pw })) setSecret(pw) }
  const Item = ({ label, text, onClick, tone }: { label: string; text: string; onClick: () => void; tone?: 'warn' }) => (
    <li><button type="button" className={`a-menu-item${tone ? ' is-warn' : ''}`} disabled={!!pending} onClick={onClick}><b>{label}</b><small>{text}</small></button></li>
  )
  return (
    <div className="a-actions">
      {row.locked && <button type="button" className="btn btn-ghost btn-sm" disabled={!!pending} onClick={() => void run('unlock')}>رفع قفل</button>}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => open('menu')} aria-haspopup="dialog">مدیریت</button>
      {err && !view && <p className="err" role="alert">{err}</p>}

      <Modal open={view !== null} onClose={() => setView(null)} title={`مدیریت حساب «${row.name}»`}>
        {view === 'menu' && <>
          <p className="p-modal-text a-modal-who"><bdi dir="ltr">{row.username}</bdi>{row.role && <> • {ROLE_LABEL[row.role]}</>} • {row.active ? 'فعال' : 'غیرفعال'}{row.locked && ' • قفل موقت'}</p>
          <ul className="a-menu">
            {row.locked && <Item label="رفع قفل" text="پس از ۵ ورود ناموفق قفل شده؛ همین حالا باز شود." onClick={() => void run('unlock', {}, 'قفل حساب برداشته شد.')} />}
            <Item label="رمز تازه" text="یک رمز تصادفی قوی ساخته و یک بار نمایش داده می‌شود." onClick={() => open('password')} />
            <Item label="خروج از همهٔ دستگاه‌ها" text="همهٔ نشست‌های باز این حساب بسته می‌شود." onClick={() => void run('signout', {}, 'از همهٔ دستگاه‌ها خارج شد.')} />
            {row.kind === 'staff' && !self && roles.length > 2 && <Item label="تغییر نقش" text="کاربر از همه‌جا خارج می‌شود و دفعهٔ بعد پنل نقش تازه را می‌بیند." onClick={() => open('role')} />}
            {!self && (row.active
              ? <Item tone="warn" label="غیرفعال‌سازی" text="دیگر نمی‌تواند وارد شود؛ هر وقت بخواهید دوباره فعالش می‌کنید." onClick={() => open('confirm')} />
              : <Item label="فعال‌سازی" text="دوباره می‌تواند با همان نام کاربری وارد شود." onClick={() => void run('activate', {}, 'حساب فعال شد.')} />)}
          </ul>
          {done && <p className="ok" role="status">{done}</p>}
          {err && <p className="err" role="alert">{err}</p>}
        </>}
        {view === 'confirm' && <>
          <p className="p-modal-text">«{row.name}» دیگر نمی‌تواند وارد شود و همهٔ نشست‌های فعلی‌اش بسته می‌شود.</p>
          {err && <p className="err" role="alert">{err}</p>}
          <div className="p-btn-row"><button type="button" className="btn btn-primary" disabled={!!pending} onClick={() => void run('deactivate').then((ok) => ok && setView(null))}>غیرفعال شود</button>
            <button type="button" className="btn btn-ghost" onClick={() => open('menu')}>بازگشت</button></div>
        </>}
        {view === 'password' && (secret ? <OneTimeSecret value={secret} onDone={() => setView(null)} /> : <>
          <p className="p-modal-text">رمز قبلی از کار می‌افتد و همهٔ نشست‌های این حساب بسته می‌شود. رمز تازه فقط یک بار نمایش داده می‌شود.</p>
          {err && <p className="err" role="alert">{err}</p>}
          <div className="p-btn-row"><button type="button" className="btn btn-primary" disabled={!!pending} onClick={() => void reset()}>ساخت رمز تازه</button>
            <button type="button" className="btn btn-ghost" onClick={() => open('menu')}>بازگشت</button></div>
        </>)}
        {view === 'role' && <>
          <label className="p-field"><span>نقش تازه</span>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <div className="p-btn-row"><button type="button" className="btn btn-primary" disabled={!!pending || role === row.role} onClick={() => void run('role', { role }).then((ok) => ok && setView(null))}>ذخیره</button>
            <button type="button" className="btn btn-ghost" onClick={() => open('menu')}>بازگشت</button></div>
        </>}
      </Modal>
    </div>
  )
}

export const fmtCount = (n: number | undefined) => (n == null ? '—' : fa(n))
