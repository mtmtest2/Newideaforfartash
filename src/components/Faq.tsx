import { useId, useState, type FormEvent } from 'react'
import SectionHead from './SectionHead'
import { ArrowLeft, Mail, Phone, Plus, User, Leaf } from './Icons'
import { isIranMobile } from '../lib/fa'
import { useReveal } from '../lib/hooks'

const FAQ = [
  { q: 'آیا برای شرکت در دوره‌های فرتاش نیاز به سطح خاصی از زبان انگلیسی داریم؟', a: 'نه. پیش از شروع، آزمون تعیین سطح رایگان برگزار می‌شود و شما را در کلاسی هم‌سطح خودتان قرار می‌دهیم؛ از صفر تا پیشرفته.' },
  { q: 'چگونه می‌توانم در دوره‌های آنلاین ثبت‌نام کنم؟', a: 'کافی است دورهٔ مورد نظر را انتخاب کنید، وارد حساب کاربری شوید و ثبت‌نام را کامل کنید. در صورت نیاز، مشاوران ما هم کمک می‌کنند.' },
  { q: 'آیا امکان مدیریت و مشاهدهٔ دوره‌ها پس از اتمام آن‌ها وجود دارد؟', a: 'بله. جلسات ضبط‌شده و محتوای دوره تا مدت‌ها پس از پایان کلاس در حساب کاربری شما در دسترس است.' },
  { q: 'آیا می‌توانم از خارج از ایران هم در دوره‌های فرتاش شرکت کنم؟', a: 'بله. کلاس‌ها آنلاین برگزار می‌شوند و از هر نقطه‌ای از جهان می‌توانید به‌صورت زنده حضور پیدا کنید.' },
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
    if (!isIranMobile(String(f.get('phone') || ''))) return setErr('شمارهٔ موبایل معتبر نیست؛ مثلاً ۰۹۱۲۳۴۵۶۷۸۹')
    setErr('')
    setSent(true)
  }

  return (
    <section id="contact" className="section faq" ref={ref}>
      <Leaf className="leaf leaf-faq" />
      <div className="container">
        <SectionHead tag="پشتیبانی و مشاوره" title="پاسخ به سؤالات متداول شما" text="اگر سؤالی در ذهن دارید، این بخش به شما کمک می‌کند تا پاسخ آن را پیدا کنید." />
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
              <h3>ارتباط با مشاوران آکادمی فرتاش</h3>
              <p>برای دریافت مشاوره و راهنمایی، اطلاعات خود را ارسال کنید تا همکاران ما با شما تماس بگیرند.</p>
              {sent ? (
                <p className="ok" role="status">درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.</p>
              ) : (
                <>
                  <label className="field"><span className="sr">نام و نام‌خانوادگی</span><input name="name" placeholder="نام و نام‌خانوادگی" autoComplete="name" /><User width={18} height={18} /></label>
                  <label className="field"><span className="sr">شمارهٔ تماس</span><input name="phone" placeholder="شمارهٔ تماس" dir="ltr" inputMode="tel" autoComplete="tel" className="ltr-in" /><Phone width={18} height={18} /></label>
                  <label className="field"><span className="sr">ایمیل (اختیاری)</span><input name="email" type="email" placeholder="ایمیل (اختیاری)" dir="ltr" autoComplete="email" className="ltr-in" /><Mail width={18} height={18} /></label>
                  {err && <p className="err" role="alert">{err}</p>}
                  <button className="btn btn-primary btn-block" type="submit">ثبت درخواست مشاوره <ArrowLeft width={18} height={18} /></button>
                </>
              )}
            </form>
            <div className="consult-photo"><img src="/img/consult.webp" alt="مشاور آکادمی فرتاش با هدفون" loading="lazy" /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
