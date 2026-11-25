import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import SectionHead from './SectionHead'
import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Leaf } from './Icons'
import { ProfCard } from './Cards'
import { PROFS } from '../data'
import { useAutoplay, useNearViewport, useReveal, useCarouselPause } from '../lib/hooks'

const SECS = 5

export default function Classes() {
  const ref = useReveal<HTMLElement>()
  const [hover, pauseHandlers] = useCarouselPause()
  const { index, go, next, prev } = useAutoplay(PROFS.length, SECS * 1000, hover)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [wrapRef, near] = useNearViewport<HTMLDivElement>()

  // On phones the tabs are a swipeable row: keep the active one centred (scrolls the row only, not the page).
  useEffect(() => {
    const row = tabsRef.current
    const tab = row?.children[index] as HTMLElement | undefined
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return
    const r = row.getBoundingClientRect(), t = tab.getBoundingClientRect()
    row.scrollBy({ left: t.left + t.width / 2 - (r.left + r.width / 2), behavior: 'smooth' })
  }, [index])

  return (
    <section id="classes" className="section" ref={ref}>
      <div className="bg-shape shape-circle-navy" />
      <Leaf className="leaf leaf-classes" />
      <div className="container">
        <SectionHead tag="کلاس‌های آنلاین فرتاش" title="اساتید و کلاس‌های زبان" text="کلاس‌های زنده و تعاملی انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با همراهی اساتید مجرب." />

        <div
          ref={wrapRef}
          className="prof-wrap rv"
          {...pauseHandlers}
        >
          <button className="icon-btn nav-arrow nav-prev" onClick={prev} aria-label="استاد قبلی"><ChevronRight /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={next} aria-label="استاد بعدی"><ChevronLeft /></button>

          <div className="prof-stage" role="group" aria-roledescription="کاروسل">
            {PROFS.map((p, i) => {
              const off = (i - index + PROFS.length) % PROFS.length
              const state = off === 0 ? 'active' : off === PROFS.length - 1 ? 'past' : 'future'
              return <ProfCard key={p.lang} p={p} load={near} data-state={state} aria-hidden={state !== 'active'} inert={state !== 'active'} />
            })}
          </div>

          <div className="prof-tabs" role="tablist" aria-label="انتخاب استاد" ref={tabsRef}>
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
