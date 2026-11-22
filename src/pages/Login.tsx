import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Leaf, Phone, User } from '../components/Icons'
import { Logo, ThemeToggle } from '../components/Header'
import { fa, isIranMobile, toLatin } from '../lib/fa'

type Mode = 'login' | 'signup'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')

  const onPhone = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (mode === 'signup' && !String(f.get('name') || '').trim()) return setErr('نام و نام‌خانوادگی را وارد کنید.')
    if (!isIranMobile(phone)) return setErr('شمارهٔ موبایل معتبر نیست؛ مثلاً ۰۹۱۲۳۴۵۶۷۸۹')
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
      <div className="login-card card">
        <div className="seg" role="tablist" aria-label="ورود یا عضویت">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setStep('phone'); setErr('') }}>ورود</button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setStep('phone'); setErr('') }}>عضویت</button>
        </div>

        {step === 'phone' && (
          <form onSubmit={onPhone} noValidate>
            <h1>{mode === 'login' ? 'ورود به حساب' : 'ساخت حساب جدید'}</h1>
            <p>{mode === 'login' ? 'شمارهٔ موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود.' : 'اطلاعات خود را وارد کنید تا حساب شما ساخته شود.'}</p>
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
            <p>کد ۵ رقمی ارسال‌شده به <bdi dir="ltr">{fa(toLatin(phone))}</bdi> را وارد کنید.</p>
            <label className="field"><span className="sr">کد تأیید</span><input name="code" placeholder="• • • • •" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={5} className="ltr-in code-in" autoFocus /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit">{mode === 'login' ? 'ورود' : 'ساخت حساب'}</button>
            <button type="button" className="link-btn" onClick={() => { setStep('phone'); setErr('') }}>ویرایش شماره</button>
          </form>
        )}
        {step === 'done' && (
          <div className="login-done" role="status">
            <h1>خوش آمدید!</h1>
            <p>این صفحه فعلاً نمایشی است و به سرویس ورود واقعی وصل نشده.</p>
            <Link to="/" className="btn btn-primary btn-block">بازگشت به صفحهٔ اصلی <ArrowLeft width={18} height={18} /></Link>
          </div>
        )}
        <Link to="/" className="back-link"><ChevronRight width={16} height={16} /> بازگشت به صفحهٔ اصلی</Link>
      </div>
    </main>
  )
}
