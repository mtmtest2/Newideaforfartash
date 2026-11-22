import { useState } from 'react'
import SectionHead from './SectionHead'
import { ArrowLeft, Bars, ChevronLeft, ChevronRight, Flag, Star, Users } from './Icons'
import { fa, faMoney } from '../lib/fa'
import { useAutoplay, useReveal } from '../lib/hooks'

type Prof = {
  lang: string; flag: 'uk' | 'de' | 'fr' | 'it'; teacher: string; role: string; img: string
  tags: string[]; students: number; rating: string; level: string; text: string; price: number
}

const PROFS: Prof[] = [
  { lang: 'زبان انگلیسی', flag: 'uk', teacher: 'استاد آرمان کیانی', role: 'مدرس آیلتس و مکالمه', img: '/img/prof-en.webp',
    tags: ['عمومی', 'آیلتس', 'مکالمه'], students: 370, rating: '4.9', level: 'متوسط',
    text: 'تقویت مهارت‌های چهارگانهٔ زبان انگلیسی برای تحصیل، کار و زندگی روزمره.', price: 9900000 },
  { lang: 'زبان آلمانی', flag: 'de', teacher: 'استاد مهسا فرهادی', role: 'مدرس آزمون‌های گوته', img: '/img/prof-de.webp',
    tags: ['عمومی', 'آزمون گوته', 'مکالمه'], students: 520, rating: '4.8', level: 'متوسط',
    text: 'یادگیری آلمانی با تمرکز بر مکالمه و آمادگی آزمون‌های بین‌المللی.', price: 7790000 },
  { lang: 'زبان فرانسوی', flag: 'fr', teacher: 'استاد سینا رضایی', role: 'مدرس دلف و مکالمه', img: '/img/prof-fr.webp',
    tags: ['عمومی', 'DELF', 'مکالمه'], students: 950, rating: '4.9', level: 'متوسط',
    text: 'یادگیری فرانسوی به‌صورت کاربردی برای تحصیل، مهاجرت و فرصت‌های شغلی.', price: 9900000 },
]

export default function Classes() {
  const ref = useReveal<HTMLElement>()
  const [hover, setHover] = useState(false)
  const { index, go, next, prev } = useAutoplay(PROFS.length, 5000, hover)
  const SECS = 5

  return (
    <section id="classes" className="section" ref={ref}>
      <div className="bg-shape shape-circle-navy" />
      <div className="container">
        <SectionHead tag="کلاس‌های آنلاین فرتاش" title="کلاس‌های زبان در فرتاش" text="کلاس‌های زنده و تعاملی زبان انگلیسی، آلمانی و فرانسوی با همراهی اساتید مجرب." />

        <div
          className="prof-wrap rv"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocusCapture={() => setHover(true)}
          onBlurCapture={() => setHover(false)}
        >
          <button className="icon-btn nav-arrow nav-prev" onClick={next} aria-label="استاد بعدی"><ChevronLeft /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={prev} aria-label="استاد قبلی"><ChevronRight /></button>

          <div className="prof-stage" role="group" aria-roledescription="کاروسل" aria-live="off">
            {PROFS.map((p, i) => {
              const off = (i - index + PROFS.length) % PROFS.length
              const state = off === 0 ? 'active' : off === PROFS.length - 1 ? 'past' : 'future'
              return (
                <article key={p.lang} className="card prof-card" data-state={state} aria-hidden={state !== 'active'} inert={state !== 'active'}>
                  <div className="prof-info">
                    <span className="lang-chip"><Flag code={p.flag} /> کلاس {p.lang}</span>
                    <p className="prof-name"><b>{p.teacher}</b><span>{p.role}</span></p>
                    <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                    <ul className="meta">
                      <li><Users width={18} height={18} /> {fa(p.students)}+</li>
                      <li className="rate"><Star width={17} height={17} /> {fa(p.rating).replace('.', '٫')}</li>
                      <li><Bars width={17} height={17} className="lvl" /> {p.level}</li>
                    </ul>
                    <p className="desc">{p.text}</p>
                    <div className="prof-foot">
                      <strong className="price">{faMoney(p.price)}</strong>
                      <a href="#contact" className="btn btn-outline btn-sm">ثبت‌نام <ArrowLeft width={16} height={16} /></a>
                    </div>
                  </div>
                  <div className="prof-photo"><img src={p.img} alt={`${p.teacher}، ${p.role}`} loading="lazy" /></div>
                </article>
              )
            })}
          </div>

          <div className="prof-tabs" role="tablist" aria-label="انتخاب استاد">
            {PROFS.map((p, i) => (
              <button key={p.lang} role="tab" aria-selected={i === index} className="prof-tab" onClick={() => go(i)}>
                <Flag code={p.flag} />
                <span>{p.teacher.replace('استاد ', '')}</span>
                <i className="bar"><em key={i === index ? index : 'x'} style={i === index ? ({ animationDuration: `${SECS}s`, animationPlayState: hover ? 'paused' : 'running' } as React.CSSProperties) : undefined} /></i>
              </button>
            ))}
          </div>
        </div>

        <div className="center rv"><a href="#contact" className="btn btn-dark">مشاهده همهٔ کلاس‌ها <ArrowLeft /></a></div>
      </div>
    </section>
  )
}
