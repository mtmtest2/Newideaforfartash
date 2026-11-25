import { useId, useState, type FormEvent } from 'react'
import SectionHead from './SectionHead'
import { ArrowLeft, Mail, Phone, Plus, User, Leaf } from './Icons'
import { isIranMobile } from '../lib/fa'
import { useReveal } from '../lib/hooks'
import consultImg from '../assets/img/consult.webp'

const FAQ = [
  { q: 'برای شرکت در دوره‌ها باید سطح خاصی از زبان داشته باشم؟', a: 'نه. پیش از شروع، تعیین سطح رایگان انجام می‌شود و شما را در کلاسی متناسب با سطح خودتان قرار می‌دهیم؛ از مبتدی تا پیشرفته.' },
  { q: 'چطور در دوره‌ها ثبت‌نام کنم؟', a: 'دورهٔ مورد نظرتان را انتخاب کنید، وارد حساب کاربری شوید و ثبت‌نام را تکمیل کنید. اگر سؤالی داشتید، مشاوران ما راهنمایی‌تان می‌کنند.' },
  { q: 'بعد از پایان دوره هم به جلسات و محتوای آن دسترسی دارم؟', a: 'بله. جلسات ضبط‌شده و محتوای دوره بعد از پایان کلاس هم در حساب کاربری شما در دسترس است.' },
  { q: 'از خارج از ایران هم می‌توانم در دوره‌ها شرکت کنم؟', a: 'بله. کلاس‌ها آنلاین برگزار می‌شوند و از هر جای دنیا می‌توانید به‌صورت زنده در آن‌ها شرکت کنید.' },
]

export default function Faq() {
  const ref = useReveal<HTMLElement>()
  const [open, setOpen] = useState<number | null>(0)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const uid = useId()

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (!String(f.get('name') || '').trim()) return setErr('نام و نام‌خانوادگی را وارد کنید.')
    if (!isIranMobile(String(f.get('phone') || ''))) return setErr('شمارهٔ موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
    setErr('')
    setSent(true)
  }

  return (
    <section id="contact" className="section faq" ref={ref}>
      <Leaf className="leaf leaf-faq" />
      <div className="container">
        <SectionHead tag="پشتیبانی و مشاوره" title="پاسخ به سؤالات متداول" text="اگر سؤالی دارید، احتمالاً پاسخش را همین‌جا پیدا می‌کنید." />
        <div className="faq-grid">
          <div className="faq-list rv">
            <p className="faq-label">سؤالات متداول</p>
            {FAQ.map((f, i) => (
              <div key={f.q} className={`faq-item${open === i ? ' open' : ''}`}>
                <h3>
                  <button type="button" aria-expanded={open === i} aria-controls={`${uid}-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                    <span className="plus"><Plus width={18} height={18} /></span>
                    <span>{f.q}</span>
                  </button>
                </h3>
                <div className="faq-a" id={`${uid}-${i}`} role="region"><div><p>{f.a}</p></div></div>
              </div>
            ))}
          </div>

          <div className="card consult rv" style={{ '--d': '120ms' } as React.CSSProperties}>
            <form onSubmit={submit} noValidate>
              <h3>گفت‌وگو با مشاوران فرتاش</h3>
              <p>اطلاعات تماستان را بگذارید تا مشاوران ما برای راهنمایی با شما تماس بگیرند.</p>
              {sent ? (
                <p className="ok" role="status">درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.</p>
              ) : (
                <>
                  <label className="field"><span className="sr">نام و نام‌خانوادگی</span><input name="name" placeholder="نام و نام‌خانوادگی" autoComplete="name" /><User width={18} height={18} /></label>
                  <label className="field"><span className="sr">شمارهٔ موبایل</span><input name="phone" placeholder="شمارهٔ موبایل" dir="ltr" inputMode="tel" autoComplete="tel" className="ltr-in" /><Phone width={18} height={18} /></label>
                  <label className="field"><span className="sr">ایمیل (اختیاری)</span><input name="email" type="email" placeholder="ایمیل (اختیاری)" dir="ltr" autoComplete="email" className="ltr-in" /><Mail width={18} height={18} /></label>
                  {err && <p className="err" role="alert">{err}</p>}
                  <button className="btn btn-primary btn-block" type="submit">ثبت درخواست مشاوره <ArrowLeft width={18} height={18} /></button>
                </>
              )}
            </form>
            <div className="consult-photo"><img src={consultImg} alt="مشاور فرتاش با هدفون" width={608} height={660} loading="lazy" decoding="async" /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
