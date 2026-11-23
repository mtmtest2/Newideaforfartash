import { useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHead from './SectionHead'
import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Leaf } from './Icons'
import { ProfCard } from './Cards'
import { PROFS } from '../data'
import { useAutoplay, useReveal } from '../lib/hooks'

const SECS = 5

export default function Classes() {
  const ref = useReveal<HTMLElement>()
  const [hover, setHover] = useState(false)
  const { index, go, next, prev } = useAutoplay(PROFS.length, SECS * 1000, hover)

  return (
    <section id="classes" className="section" ref={ref}>
      <div className="bg-shape shape-circle-navy" />
      <Leaf className="leaf leaf-classes" />
      <div className="container">
        <SectionHead tag="کلاس‌های آنلاین فرتاش" title="اساتید و کلاس‌های زبان" text="کلاس‌های زنده و تعاملی انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با همراهی اساتید مجرب." />

        <div
          className="prof-wrap rv"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocusCapture={() => setHover(true)}
          onBlurCapture={() => setHover(false)}
        >
          <button className="icon-btn nav-arrow nav-prev" onClick={next} aria-label="استاد بعدی"><ChevronLeft /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={prev} aria-label="استاد قبلی"><ChevronRight /></button>

          <div className="prof-stage" role="group" aria-roledescription="کاروسل">
            {PROFS.map((p, i) => {
              const off = (i - index + PROFS.length) % PROFS.length
              const state = off === 0 ? 'active' : off === PROFS.length - 1 ? 'past' : 'future'
              return <ProfCard key={p.lang} p={p} data-state={state} aria-hidden={state !== 'active'} inert={state !== 'active'} />
            })}
          </div>

          <div className="prof-tabs" role="tablist" aria-label="انتخاب استاد">
            {PROFS.map((p, i) => (
              <button key={p.lang} role="tab" aria-selected={i === index} className="prof-tab" onClick={() => go(i)}>
                <Flag code={p.flag} />
                <span>{p.lang.replace('زبان ', '')}</span>
                <i className="bar"><em key={i === index ? index : 'x'} style={i === index ? { animationDuration: `${SECS}s`, animationPlayState: hover ? 'paused' : 'running' } : undefined} /></i>
              </button>
            ))}
          </div>
        </div>

        <div className="center rv"><Link to="/teachers" className="btn btn-dark">مشاهدهٔ همهٔ اساتید <ArrowLeft /></Link></div>
      </div>
    </section>
  )
}
