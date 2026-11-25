import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bars, ChevronRight, Flag, Leaf, Phone, Star, User } from '../components/Icons'
import { HERO } from '../assets'
import { PROFS } from '../data'
import avWoman from '../assets/img/av-woman.webp'
import { Logo, ThemeToggle } from '../components/Header'
import { fa, isIranMobile, toLatin } from '../lib/fa'

type Mode = 'login' | 'signup'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    document.title = 'ورود / عضویت | فرتاش'
  }, [])

  const onPhone = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (mode === 'signup' && !String(f.get('name') || '').trim()) return setErr('نام و نام‌خانوادگی را وارد کنید.')
    if (!isIranMobile(phone)) return setErr('شمارهٔ موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
    setErr(''); setStep('code')
  }
  const onCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const code = toLatin(String(new FormData(e.currentTarget).get('code') || ''))
    if (!/^\d{5}$/.test(code)) return setErr('کد تأیید ۵ رقمی را وارد کنید.')
    setErr(''); setStep('done')
  }

  return (
    <main className="login-page">
      <Leaf className="leaf leaf-login-a" />
      <Leaf className="leaf leaf-login-b" />
      <div className="bg-shape shape-circle-navy" />
      <div className="login-top container">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="login-body container">
      <div className="login-card card">
        <div className="seg" role="tablist" aria-label="ورود یا عضویت">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setStep('phone'); setErr('') }}>ورود</button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setStep('phone'); setErr('') }}>عضویت</button>
        </div>

        {step === 'phone' && (
          <form onSubmit={onPhone} noValidate>
            <h1>{mode === 'login' ? 'ورود به حساب کاربری' : 'ساخت حساب کاربری'}</h1>
            <p>{mode === 'login' ? 'شمارهٔ موبایلتان را وارد کنید تا کد تأیید برایتان پیامک شود.' : 'نام و شمارهٔ موبایلتان را وارد کنید تا حساب کاربری‌تان ساخته شود.'}</p>
            {mode === 'signup' && (
              <label className="field"><span className="sr">نام و نام‌خانوادگی</span><input name="name" placeholder="نام و نام‌خانوادگی" autoComplete="name" /><User width={18} height={18} /></label>
            )}
            <label className="field"><span className="sr">شمارهٔ موبایل</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" inputMode="tel" autoComplete="tel" className="ltr-in" /><Phone width={18} height={18} /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit">دریافت کد تأیید <ArrowLeft width={18} height={18} /></button>
          </form>
        )}
        {step === 'code' && (
          <form onSubmit={onCode} noValidate>
            <h1>کد تأیید</h1>
            <p>کد ۵ رقمی پیامک‌شده به <bdi dir="ltr">{fa(toLatin(phone))}</bdi> را وارد کنید.</p>
            <label className="field"><span className="sr">کد تأیید</span><input name="code" placeholder="• • • • •" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={5} className="ltr-in code-in" autoFocus /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit">{mode === 'login' ? 'ورود' : 'ساخت حساب'}</button>
            <button type="button" className="link-btn" onClick={() => { setStep('phone'); setErr('') }}>ویرایش شماره</button>
          </form>
        )}
        {step === 'done' && (
          <div className="login-done" role="status">
            <h1>خوش آمدید!</h1>
            <p>این صفحه فعلاً نمایشی است و هنوز به سامانهٔ ورود متصل نشده است.</p>
            <Link to="/" className="btn btn-primary btn-block">بازگشت به صفحهٔ اصلی <ArrowLeft width={18} height={18} /></Link>
          </div>
        )}
        <Link to="/" className="back-link"><ChevronRight width={16} height={16} /> بازگشت به صفحهٔ اصلی</Link>
      </div>
      <LoginAside />
      </div>
    </main>
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
