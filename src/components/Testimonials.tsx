import { useState } from 'react'
import SectionHead from './SectionHead'
import { ChevronLeft, ChevronRight, Star, Leaf } from './Icons'
import { useAutoplay, useReveal } from '../lib/hooks'

const ITEMS = [
  { name: 'امیر حسینی‌زاد', role: 'دورهٔ انگلیسی • کسب‌وکار', img: '/img/av-amir.webp', text: 'به‌دلیل دوره‌هایی بودم که بتونم زبان انگلیسی رو برای همیشه کنار گذاشتن کارم، و لیسانس، واقعاً همچین چیزی بود که نیاز داشتم. مربی‌ها با ارتباط و پاسخگویی‌های شفافی خیلی برام مفید بودن.' },
  { name: 'سارا رضایی', role: 'دورهٔ مکالمهٔ حرفه‌ای لینگانو', img: '/img/av-sara.webp', text: 'من از دورهٔ مکالمهٔ پیشرفته استفاده کردم و واقعاً از کیفیت مطالب و نظم برنامه‌ریزی دوره راضی بودم. حس می‌کنم مسیری به فیل با اطمینان بیشتری صحبت می‌کنم.' },
  { name: 'نگار احمدی', role: 'دورهٔ آلمانی • مهاجرت', img: '/img/av-woman.webp', text: 'کلاس‌های کوچک و تعاملی باعث شد از همان جلسهٔ اول جرأت صحبت کردن پیدا کنم. استادم همیشه بازخورد دقیق و به‌موقع می‌داد.' },
  { name: 'پویا کریمی', role: 'دورهٔ فرانسوی • تحصیل', img: '/img/av-man.webp', text: 'برنامهٔ مرتب و تمرین‌های هدفمند کمک کرد در شش ماه به سطح مورد نیاز دلف برسم. پشتیبانی هم همیشه در دسترس بود.' },
]

export default function Testimonials() {
  const ref = useReveal<HTMLElement>()
  const [hover, setHover] = useState(false)
  const { index, go, next, prev } = useAutoplay(ITEMS.length, 6000, hover)
  const pair = [ITEMS[index], ITEMS[(index + 1) % ITEMS.length]]

  return (
    <section className="section testi" ref={ref}>
      <div className="bg-shape shape-circle-navy shape-end" />
      <Leaf className="leaf leaf-testi" />
      <div className="container">
        <div className="testi-top rv">
          <SectionHead tag="نظرات زبان‌آموزان" title="داستان موفقیت زبان‌آموزان فرتاش" text="نظر شما برای ما مهم است. چون می‌خواهیم اطمینان داشته باشیم از وقتی که صرف می‌کنید بهترین نتیجه را می‌گیرید." />
          <div className="arrows">
            <button className="icon-btn ring" onClick={prev} aria-label="نظر قبلی"><ChevronRight /></button>
            <button className="icon-btn ring" onClick={next} aria-label="نظر بعدی"><ChevronLeft /></button>
          </div>
        </div>
        <div className="testi-grid rv" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          {pair.map((t, k) => (
            <figure key={`${index}-${k}`} className="card quote" style={{ '--d': `${k * 90}ms` } as React.CSSProperties}>
              <div className="quote-top">
                <span className="stars" aria-label="امتیاز ۵ از ۵">{Array.from({ length: 5 }, (_, s) => <Star key={s} width={20} height={20} />)}</span>
                <span className="qmark" aria-hidden="true">”</span>
              </div>
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <img src={t.img} alt="" width={56} height={56} loading="lazy" />
                <span><b>{t.name}</b><small>{t.role}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="dots rv" role="tablist" aria-label="انتخاب نظر">
          {ITEMS.map((t, i) => <button key={t.name} role="tab" aria-selected={i === index} aria-label={`نظر ${t.name}`} className={i === index ? 'on' : ''} onClick={() => go(i)} />)}
        </div>
      </div>
    </section>
  )
}
