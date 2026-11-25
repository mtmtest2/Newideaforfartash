import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { ArrowLeft, Clock, Phone, User } from '../components/Icons'
import { PROFS } from '../data'
import { isIranMobile } from '../lib/fa'

const STEPS = [
  'فرم زیر را پر کنید.',
  'کارشناس آموزشی برای هماهنگی زمان با شما تماس می‌گیرد.',
  'در یک جلسهٔ آنلاین کوتاه، سطح شما بر اساس چارچوب اروپایی (CEFR) مشخص می‌شود.',
  'کلاس متناسب با سطح و هدفتان به شما پیشنهاد می‌شود.',
]

export default function Placement() {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (!String(f.get('name') || '').trim()) return setErr('نام و نام‌خانوادگی را وارد کنید.')
    if (!isIranMobile(String(f.get('phone') || ''))) return setErr('شمارهٔ موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
    setErr('')
    setSent(true)
  }

  return (
    <PageShell tag="رایگان" title="تعیین سطح رایگان" text="پیش از شروع کلاس، سطح زبانتان را رایگان بسنجید تا در کلاس مناسب خودتان قرار بگیرید.">
      <div className="placement rv">
        <ol className="placement-steps">
          {STEPS.map((s, i) => <li key={s}><span>{['۱', '۲', '۳', '۴'][i]}</span>{s}</li>)}
          <li className="note"><Clock width={18} height={18} /> مدت جلسه: حدود ۲۰ دقیقه</li>
        </ol>
        <div className="card placement-card">
          {sent ? (
            <div className="ok-box" role="status">
              <h3>درخواست شما ثبت شد</h3>
              <p>کارشناسان فرتاش به‌زودی برای هماهنگی جلسهٔ تعیین سطح با شما تماس می‌گیرند.</p>
              <Link to="/" className="btn btn-primary btn-block">بازگشت به صفحهٔ اصلی <ArrowLeft width={18} height={18} /></Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="field"><span className="sr">نام و نام‌خانوادگی</span><input name="name" placeholder="نام و نام‌خانوادگی" autoComplete="name" /><User width={18} height={18} /></label>
              <label className="field"><span className="sr">شمارهٔ موبایل</span><input name="phone" placeholder="شمارهٔ موبایل" dir="ltr" inputMode="tel" autoComplete="tel" className="ltr-in" /><Phone width={18} height={18} /></label>
              <label className="select-field">
                <span>زبان مورد نظر</span>
                <select name="lang" defaultValue={PROFS[0].lang}>
                  {PROFS.map((p) => <option key={p.lang}>{p.lang}</option>)}
                </select>
              </label>
              <fieldset className="chips">
                <legend>زمان مناسب برای تماس</legend>
                {['صبح', 'ظهر', 'عصر'].map((t, i) => (
                  <label key={t}><input type="radio" name="time" value={t} defaultChecked={i === 2} /><span>{t}</span></label>
                ))}
              </fieldset>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn btn-primary btn-block" type="submit">ثبت درخواست تعیین سطح <ArrowLeft width={18} height={18} /></button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  )
}
