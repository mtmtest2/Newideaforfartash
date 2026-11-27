import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import SectionHead from './SectionHead'
import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Leaf } from './Icons'
import { ProfCard } from './Cards'
import { useRouteData } from '../content/context'
import { FALLBACK_HOME } from '../content/fallback'
import { courseAsProf, toProf, type CardProf } from '../content/adapters'
import type { HomeDTO } from '../content/types'
import { useAutoplay, useNearViewport, useReveal, useCarouselPause } from '../lib/hooks'

const SECS = 5

export default function Classes() {
  const home = useRouteData<HomeDTO>()
  const section = home.status === 'ready' ? home.data.teachers : FALLBACK_HOME.teachers
  return (
    <ProfCarousel id="classes" tag={section.tag ?? 'کلاس‌های آنلاین فرتاش'} title={section.title ?? 'اساتید و کلاس‌های زبان'} text={section.description}
      items={section.items.map(toProf)} labels={{ prev: 'استاد قبلی', next: 'استاد بعدی', tabs: 'انتخاب استاد' }}
      tabLabel={(p) => p.lang.replace('زبان ', '')} more={{ to: '/teachers', label: 'مشاهدهٔ همهٔ اساتید' }} />
  )
}

/** Offline courses: the same approved carousel (cards, stack, tabs, autoplay), fed by the CMS. Rendered only when the
 *  server sends a `courses` section, i.e. the feature flag is on and courses are configured. */
export function CoursesCarousel({ section }: { section: NonNullable<HomeDTO['courses']> }) {
  return (
    <ProfCarousel id="courses" tag={section.tag ?? 'دوره‌های ضبط‌شدهٔ فرتاش'} title={section.title ?? 'دوره‌های آفلاین فرتاش'} text={section.description}
      items={section.items.map(courseAsProf)} chip="دورهٔ" hrefOf={(p) => `/courses/${p.slug}`}
      labels={{ prev: 'دورهٔ قبلی', next: 'دورهٔ بعدی', tabs: 'انتخاب دوره' }} tabLabel={(p) => p.teacher}
      more={{ to: '/courses', label: 'مشاهدهٔ همهٔ دوره‌ها' }} />
  )
}

type CarouselProps = {
  id: string; tag: string; title: string; text?: string; items: CardProf[]; chip?: string; hrefOf?: (p: CardProf) => string
  labels: { prev: string; next: string; tabs: string }; tabLabel: (p: CardProf) => string; more: { to: string; label: string }
}

export function ProfCarousel({ id, tag, title, text, items: PROFS, chip, hrefOf, labels, tabLabel, more }: CarouselProps) {
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
    <section id={id} className="section" ref={ref}>
      <div className="bg-shape shape-circle-navy" />
      <Leaf className="leaf leaf-classes" />
      <div className="container">
        <SectionHead tag={tag} title={title} text={text} />

        <div
          ref={wrapRef}
          className="prof-wrap rv"
          {...pauseHandlers}
        >
          <button className="icon-btn nav-arrow nav-prev" onClick={prev} aria-label={labels.prev}><ChevronRight /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={next} aria-label={labels.next}><ChevronLeft /></button>

          <div className="prof-stage" role="group" aria-roledescription="اسلایدر">
            {PROFS.map((p, i) => {
              const off = (i - index + PROFS.length) % PROFS.length
              const state = off === 0 ? 'active' : off === PROFS.length - 1 ? 'past' : 'future'
              return <ProfCard key={p.key} p={p} chip={chip} href={hrefOf?.(p)} load={near} data-state={state} aria-hidden={state !== 'active'} inert={state !== 'active'} />
            })}
          </div>

          <div className="prof-tabs" role="tablist" aria-label={labels.tabs} ref={tabsRef}>
            {PROFS.map((p, i) => (
              <button key={p.key} role="tab" aria-selected={i === index} className="prof-tab" onClick={() => go(i)}>
                <Flag code={p.flag} />
                <span>{tabLabel(p)}</span>
                <i className="bar"><em key={i === index ? index : 'x'} style={i === index ? { animationDuration: `${SECS}s`, animationPlayState: hover ? 'paused' : 'running' } : undefined} /></i>
              </button>
            ))}
          </div>
        </div>

        <div className="center rv"><Link to={more.to} className="btn btn-dark">{more.label} <ArrowLeft /></Link></div>
      </div>
    </section>
  )
}
