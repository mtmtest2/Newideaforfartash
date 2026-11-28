import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bars, ChevronRight, Flag, Leaf, Phone, Star, User } from '../components/Icons'
import { HERO } from '../assets'
import { PROFS } from '../data'
import avWoman from '../assets/img/av-woman.webp'
import { Logo, ThemeToggle } from '../components/Header'
import { fa, toLatin } from '../lib/fa'
import { authApi, safeNext, type Audience, type StaffRole } from '../auth/client'

type Method = 'password' | 'otp'
const isMobile = (v: string) => /^09\d{9}$/.test(toLatin(v).replace(/[\s-]/g, '').replace(/^\+98/, '0'))

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}
  </svg>
)
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
)

function PasswordField({ name, label, autoComplete, value, onChange, hint }: { name: string; label: string; autoComplete: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-wrap">
      <label className="field">
        <span className="sr">{label}</span>
        <input name={name} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label}
          autoComplete={autoComplete} dir="ltr" className="ltr-in" maxLength={128} required aria-describedby={hint ? `${name}-hint` : undefined} />
        <KeyIcon />
      </label>
      <button type="button" className="pw-eye" aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'} aria-pressed={show} onClick={() => setShow((v) => !v)}><EyeIcon off={show} /></button>
      {hint && <small id={`${name}-hint`} className="field-hint">{hint}</small>}
    </div>
  )
}

/** Username + password form (members and staff). */
function PasswordForm({ aud, next, title, text, submit }: { aud: Audience; next: string; title: string; text: string; submit: string }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return setErr('نام کاربری و رمز عبور را وارد کنید.')
    setBusy(true); setErr('')
    const r = await authApi.login(aud, toLatin(username.trim()), password, next)
    setBusy(false)
    if (!r.ok) { setPassword(''); return setErr(r.message) }
    navigate(r.data.redirect, { replace: true })
  }
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy}>
      <h1>{title}</h1>
      <p>{text}</p>
      <label className="field"><span className="sr">{aud === 'staff' ? 'نام کاربری یا ایمیل' : 'نام کاربری'}</span>
        <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={aud === 'staff' ? 'نام کاربری یا ایمیل' : 'نام کاربری'}
          autoComplete="username" dir="ltr" className="ltr-in" autoCapitalize="none" spellCheck={false} maxLength={80} required /><User width={18} height={18} />
      </label>
      <PasswordField name="password" label="رمز عبور" autoComplete="current-password" value={password} onChange={setPassword} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'در حال ورود…' : submit} {!busy && <ArrowLeft width={18} height={18} />}</button>
    </form>
  )
}

/** Phone + one-time code. Members without an account get one; staff need a phone registered by the owner. */
function OtpForm({ aud, next, onNewMember }: { aud: Audience; next: string; onNewMember: (redirect: string) => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const [devCode, setDevCode] = useState('')
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t) }, [wait])
  const send = async () => {
    if (!isMobile(phone)) return setErr('شمارهٔ موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
    setBusy(true); setErr('')
    const r = await authApi.otpRequest(aud, toLatin(phone))
    setBusy(false)
    if (!r.ok) { if (typeof r.data.retryAfter === 'number' && r.data.retryAfter < 120) setWait(r.data.retryAfter); return setErr(r.message) }
    setDevCode(r.data.devCode ?? ''); setStep('code'); setCode(''); setWait(r.data.resendIn)
  }
  const verify = async (e: FormEvent) => {
    e.preventDefault()
    const c = toLatin(code).trim()
    if (!/^\d{6}$/.test(c)) return setErr('کد ۶ رقمی را وارد کنید.')
    setBusy(true); setErr('')
    const r = await authApi.otpVerify(aud, toLatin(phone), c, undefined, next)
    setBusy(false)
    if (!r.ok) { setCode(''); return setErr(r.message) }
    if (r.data.isNew) return onNewMember(r.data.redirect)
    navigate(r.data.redirect, { replace: true })
  }
  if (step === 'phone') return (
    <form onSubmit={(e) => { e.preventDefault(); void send() }} noValidate aria-busy={busy}>
      <h1>{aud === 'staff' ? 'ورود با کد پیامکی' : 'ورود یا عضویت با موبایل'}</h1>
      <p>{aud === 'staff' ? 'شمارهٔ موبایلی را وارد کنید که مدیر آموزشگاه برای حسابتان ثبت کرده است.' : 'کد ۶ رقمی به این شماره پیامک می‌شود. اگر حساب ندارید، همین‌جا ساخته می‌شود.'}</p>
      <label className="field"><span className="sr">شمارهٔ موبایل</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" inputMode="tel" autoComplete="tel" className="ltr-in" maxLength={16} /><Phone width={18} height={18} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || wait > 0}>{wait > 0 ? `ارسال دوباره تا ${fa(wait)} ثانیه` : busy ? 'در حال ارسال…' : 'دریافت کد'} {!busy && !wait && <ArrowLeft width={18} height={18} />}</button>
    </form>
  )
  return (
    <form onSubmit={verify} noValidate aria-busy={busy}>
      <h1>کد تأیید</h1>
      <p>کد ۶ رقمی پیامک‌شده به <bdi dir="ltr">{fa(toLatin(phone))}</bdi> را وارد کنید.</p>
      <label className="field"><span className="sr">کد تأیید</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="• • • • • •" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="ltr-in code-in" autoFocus /></label>
      {devCode && <p className="demo-note">محیط آزمایشی (بدون سرویس پیامک): کد <b dir="ltr">{devCode}</b> است. در سرور اصلی این پیام نمایش داده نمی‌شود.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'در حال بررسی…' : 'تأیید و ورود'}</button>
      <div className="otp-links">
        <button type="button" className="link-btn" onClick={() => { setStep('phone'); setErr('') }}>ویرایش شماره</button>
        <button type="button" className="link-btn" disabled={wait > 0 || busy} onClick={() => void send()}>{wait > 0 ? `ارسال دوباره (${fa(wait)})` : 'ارسال دوبارهٔ کد'}</button>
      </div>
    </form>
  )
}

function RegisterForm({ next }: { next: string }) {
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', username: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (f.name.trim().length < 2) return setErr('نام و نام خانوادگی را وارد کنید.')
    if (!/^[a-z][a-z0-9._]{3,29}$/i.test(toLatin(f.username.trim()))) return setErr('نام کاربری: ۴ تا ۳۰ حرف لاتین، عدد، نقطه یا _ و شروع با حرف.')
    if (f.password.length < 10) return setErr('رمز عبور باید دست‌کم ۱۰ نویسه باشد.')
    if (f.password !== f.confirm) return setErr('تکرار رمز عبور با خودش یکی نیست.')
    setBusy(true); setErr('')
    const r = await authApi.register(f.name.trim(), toLatin(f.username.trim()).toLowerCase(), f.password, next)
    setBusy(false)
    if (!r.ok) return setErr(r.message)
    navigate(r.data.redirect, { replace: true })
  }
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy}>
      <h1>ساخت حساب کاربری</h1>
      <p>با یک حساب به کلاس‌ها، تکالیف و گروه‌های کلاس دسترسی دارید.</p>
      <label className="field"><span className="sr">نام و نام خانوادگی</span><input value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="نام و نام خانوادگی" autoComplete="name" maxLength={80} required /><User width={18} height={18} /></label>
      <div>
        <label className="field"><span className="sr">نام کاربری</span><input value={f.username} onChange={(e) => set('username')(e.target.value)} placeholder="نام کاربری (لاتین)" autoComplete="username" dir="ltr" className="ltr-in" autoCapitalize="none" spellCheck={false} maxLength={30} required aria-describedby="un-hint" /><User width={18} height={18} /></label>
        <small id="un-hint" className="field-hint">مثلاً sara.rezaei — حروف لاتین، عدد، نقطه یا _</small>
      </div>
      <PasswordField name="new-password" label="رمز عبور" autoComplete="new-password" value={f.password} onChange={set('password')} hint="دست‌کم ۱۰ نویسه؛ ترکیب حروف و عدد امن‌تر است." />
      <PasswordField name="confirm-password" label="تکرار رمز عبور" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'در حال ساخت حساب…' : 'ساخت حساب و ورود'} {!busy && <ArrowLeft width={18} height={18} />}</button>
    </form>
  )
}

/** After a first sign-in by phone code: ask for the real name (the account was created as «کاربر فرتاش»). */
function CompleteProfile({ redirect }: { redirect: string }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('نام و نام خانوادگی را وارد کنید.')
    const r = await authApi.profile('member', name.trim())
    if (!r.ok) return setErr(r.message)
    navigate(redirect, { replace: true })
  }
  return (
    <form onSubmit={onSubmit} noValidate>
      <h1>خوش آمدید!</h1>
      <p>حساب شما ساخته شد. نامتان را بنویسید تا در کلاس‌ها با همین نام شناخته شوید.</p>
      <label className="field"><span className="sr">نام و نام خانوادگی</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" autoComplete="name" maxLength={80} autoFocus /><User width={18} height={18} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary btn-block" type="submit">ورود به پنل <ArrowLeft width={18} height={18} /></button>
      <button type="button" className="link-btn" onClick={() => navigate(redirect, { replace: true })}>بعداً</button>
    </form>
  )
}

function MethodTabs({ method, setMethod, otp }: { method: Method; setMethod: (m: Method) => void; otp: boolean | null }) {
  return (
    <div className="seg seg-sm" role="tablist" aria-label="روش ورود">
      <button type="button" role="tab" aria-selected={method === 'password'} className={method === 'password' ? 'on' : ''} onClick={() => setMethod('password')}>نام کاربری و رمز</button>
      <button type="button" role="tab" aria-selected={method === 'otp'} className={method === 'otp' ? 'on' : ''} disabled={otp === false}
        onClick={() => setMethod('otp')} title={otp === false ? 'به‌زودی فعال می‌شود' : undefined}>
        کد پیامکی {otp === false && <span className="soon">به‌زودی</span>}
      </button>
    </div>
  )
}

function useOtpEnabled() {
  const [otp, setOtp] = useState<boolean | null>(null)
  useEffect(() => { void authApi.config().then((r) => setOtp(r.ok ? r.data.otp : false)) }, [])
  return otp
}
/** If already signed in (for the requested role, when a staff page asked for one), go straight to the panel. */
function useRedirectIfSignedIn(aud: Audience, next: (home: string) => string, role?: StaffRole) {
  const navigate = useNavigate()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    void authApi.me(aud, role).then((r) => { if (r.ok && r.data.user && r.data.home) navigate(next(r.data.home), { replace: true }) })
  }, [aud, navigate, next, role])
}
const AREA_ROLE: Record<string, StaffRole> = { teacher: 'teacher', reception: 'reception', supervisor: 'supervisor', 'support-desk': 'support', owner: 'owner' }

function Frame({ children, aside, staff }: { children: ReactNode; aside?: ReactNode; staff?: boolean }) {
  return (
    <main className={`login-page${staff ? ' login-staff' : ''}`}>
      <Leaf className="leaf leaf-login-a" />
      <Leaf className="leaf leaf-login-b" />
      <div className="bg-shape shape-circle-navy" />
      <div className="login-top container">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="login-body container">
        <div className="login-card card">
          {children}
          <Link to="/" className="back-link"><ChevronRight width={16} height={16} /> بازگشت به صفحهٔ اصلی</Link>
        </div>
        {aside}
      </div>
    </main>
  )
}

/** /login and /register — students and site users. */
export default function Login() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signup = pathname.startsWith('/register')
  const next = safeNext(params.get('next'), '/panel')
  const otp = useOtpEnabled()
  const [method, setMethod] = useState<Method>('password')
  const [welcome, setWelcome] = useState<string | null>(null)
  useEffect(() => { document.title = signup ? 'عضویت | فرتاش' : 'ورود | فرتاش' }, [signup])
  useRedirectIfSignedIn('member', (home) => safeNext(next, home))
  const go = (to: string) => navigate(to + (params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''), { replace: true })
  return (
    <Frame aside={<LoginAside />}>
      {welcome ? <CompleteProfile redirect={welcome} /> : <>
        <div className="seg" role="tablist" aria-label="ورود یا عضویت">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? 'on' : ''} onClick={() => go('/login')}>ورود</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? 'on' : ''} onClick={() => go('/register')}>عضویت</button>
        </div>
        {signup ? <>
          <RegisterForm next={next} />
          {otp && <p className="alt-line">یا <button type="button" className="link-btn" onClick={() => { go('/login'); setMethod('otp') }}>با شمارهٔ موبایل عضو شوید</button></p>}
        </> : <>
          <MethodTabs method={method} setMethod={setMethod} otp={otp} />
          {method === 'password'
            ? <PasswordForm aud="member" next={next} title="ورود به حساب کاربری" text="با نام کاربری و رمز عبوری که موقع عضویت انتخاب کردید وارد شوید." submit="ورود به پنل" />
            : <OtpForm aud="member" next={next} onNewMember={setWelcome} />}
          {otp === false && <p className="demo-note">ورود با کد پیامکی به‌زودی فعال می‌شود.</p>}
        </>}
        <p className="alt-line">استاد فرتاش هستید؟ <Link to="/staff/login/teacher">ورود اساتید</Link></p>
      </>}
    </Frame>
  )
}

/** Each staff role has its own sign-in address (/staff/login/teacher …); /staff/login works for every role. */
export const ROLE_LOGIN: Record<StaffRole, { path: string; area: string; title: string; who: string; text: string }> = {
  teacher: { path: '/staff/login/teacher', area: '/teacher', title: 'ورود اساتید', who: 'استاد', text: 'با نام کاربری‌ای که مدیر آموزشگاه برایتان ساخته وارد شوید تا پنل استاد (کلاس‌ها، تکالیف، حضور و غیاب و گروه‌ها) باز شود.' },
  reception: { path: '/staff/login/reception', area: '/reception', title: 'ورود پذیرش', who: 'پذیرش', text: 'با حساب پذیرش وارد شوید تا گروه‌های کلاس و فهرست کلاس‌ها را ببینید.' },
  supervisor: { path: '/staff/login/supervisor', area: '/supervisor', title: 'ورود سوپروایزر', who: 'سوپروایزر', text: 'با حساب سوپروایزر وارد شوید.' },
  support: { path: '/staff/login/support', area: '/support-desk', title: 'ورود پشتیبانی', who: 'پشتیبانی', text: 'با حساب پشتیبانی وارد شوید تا داشبورد پشتیبانی باز شود.' },
  owner: { path: '/staff/login/owner', area: '/owner', title: 'ورود مالک', who: 'مالک', text: 'با حساب مالک وارد شوید تا داشبورد مالک باز شود.' },
}

/** /staff/login and /staff/login/:role — not linked from the public site except «ورود اساتید». */
export function StaffLogin() {
  const [params] = useSearchParams()
  const { role: roleParam } = useParams()
  const role = roleParam && roleParam in ROLE_LOGIN ? (roleParam as StaffRole) : undefined
  const R = role ? ROLE_LOGIN[role] : null
  const otp = useOtpEnabled()
  const [method, setMethod] = useState<Method>('password')
  const rawNext = params.get('next')
  useEffect(() => { document.title = `${R?.title ?? 'ورود کارکنان'} | فرتاش` }, [R])
  const asked = rawNext && /^\/(teacher|reception|supervisor|support-desk|owner)(\/|$)/.test(rawNext) ? rawNext : ''
  const next = asked || R?.area || ''
  useRedirectIfSignedIn('staff', (home) => safeNext(next || null, home), next ? AREA_ROLE[next.split('/')[1]] : undefined)
  if (roleParam && !role) return <Navigate to="/staff/login" replace />
  return (
    <Frame staff aside={<StaffAside current={role} />}>
      <span className="pill staff-pill">{R ? `بخش ${R.who}` : 'بخش کارکنان'}</span>
      <MethodTabs method={method} setMethod={setMethod} otp={otp} />
      {method === 'password'
        ? <PasswordForm aud="staff" next={next} title={R ? `${R.title} فرتاش` : 'ورود کارکنان فرتاش'}
            text={R?.text ?? 'با نام کاربری‌ای که مدیر آموزشگاه برایتان ساخته وارد شوید. بعد از ورود، پنل نقش شما باز می‌شود.'} submit={R ? `ورود به پنل ${R.who}` : 'ورود'} />
        : <OtpForm aud="staff" next={next} onNewMember={() => undefined} />}
      {otp === false && <p className="demo-note">ورود با کد پیامکی به‌زودی فعال می‌شود.</p>}
      <p className="alt-line">زبان‌آموز هستید؟ <Link to="/login">ورود زبان‌آموزان</Link></p>
    </Frame>
  )
}

function StaffAside({ current }: { current?: StaffRole }) {
  return (
    <aside className="login-aside staff-aside" aria-label="ورود نقش‌های کارکنان">
      <div className="la-copy">
        <span className="pill">ورود امن کارکنان</span>
        <h2>هر نقش، <span className="hl">پنل خودش</span></h2>
        <p>حساب کارکنان را فقط مالک یا پشتیبانی می‌سازد. بعد از ورود، فقط بخش‌های مربوط به نقش شما باز می‌شود.</p>
        <ul className="staff-roles">
          {(['teacher', 'reception', 'supervisor', 'support', 'owner'] as StaffRole[]).map((r) => (
            <li key={r} className={r === current ? 'on' : undefined}>
              <Link to={ROLE_LOGIN[r].path} aria-current={r === current ? 'page' : undefined}><b>{ROLE_LOGIN[r].title}</b><small dir="ltr">{ROLE_LOGIN[r].path}</small></Link>
            </li>
          ))}
        </ul>
        <p className="staff-note">نشست کارکنان پس از ۸ ساعت بسته می‌شود و پنج ورود ناموفق، حساب را ۱۵ دقیقه قفل می‌کند.</p>
      </div>
    </aside>
  )
}

const PERKS = [
  { title: 'تعیین سطح رایگان', text: 'پیش از شروع، سطح دقیق خودتان را بدانید.', icon: <path d="M3 21h18M5 17v-4M10 17V9M15 17v-6M20 17V6" /> },
  { title: 'کلاس زنده یا دورهٔ آفلاین', text: 'هر طور که با برنامه‌تان جور است یاد بگیرید.', icon: <><rect x="3" y="5" width="13" height="12" rx="2" /><path d="M16 9.5l5-3v11l-5-3z" /></> },
  { title: 'پیگیری پیشرفت و گواهی', text: 'رشدتان را ببینید و گواهی پایان دوره بگیرید.', icon: <><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8" /></> },
]

/** Desktop-only brand panel next to the form (hidden on phones; its image is lazy so phones never fetch it). */
function LoginAside() {
  return (
    <aside className="login-aside" aria-label="چرا فرتاش؟">
      <div className="la-copy">
        <span className="pill">آموزشگاه آنلاین زبان فرتاش</span>
        <h2>بیا <span className="hl">یک جور دیگه</span><br />حرف بزنیم</h2>
        <p>با یک حساب کاربری به کلاس‌های زنده، دوره‌های آفلاین و پشتیبانی هر روزهٔ فرتاش دسترسی دارید.</p>
        <ul className="la-perks">
          {PERKS.map((p) => (
            <li key={p.title}>
              <span className="la-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.icon}</svg></span>
              <span><b>{p.title}</b><small>{p.text}</small></span>
            </li>
          ))}
        </ul>
        <div className="la-langs">
          <span className="la-flags" aria-hidden="true">{PROFS.map((p) => <Flag key={p.flag} code={p.flag} />)}</span>
          <span>آموزش ۵ زبان زندهٔ دنیا</span>
        </div>
      </div>
      <div className="la-visual" aria-hidden="true">
        <div className="la-arch" />
        <div className="la-arch2" />
        <Leaf className="leaf la-leaf" />
        <img className="la-person" srcSet={HERO.dark.srcSet} sizes="300px" src={HERO.dark.src} width={HERO.dark.width} height={HERO.dark.height} loading="lazy" decoding="async" alt="" />
        <div className="la-chip la-stat">
          <Bars width={26} height={26} />
          <span><small>تعداد دوره‌ها</small><b>{fa('1200').replace(/(.)(...)$/, '$1٬$2')}+</b></span>
        </div>
        <div className="la-chip la-review">
          <img src={avWoman} width={44} height={44} alt="" loading="lazy" />
          <span>
            <i className="la-stars">{Array.from({ length: 5 }, (_, k) => <Star key={k} width={13} height={13} />)}</i>
            <b>«از همان جلسهٔ اول جرأت صحبت کردن پیدا کردم.»</b>
            <small>نگار احمدی • دورهٔ آلمانی</small>
          </span>
        </div>
      </div>
    </aside>
  )
}
