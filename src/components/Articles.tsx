import { Link } from 'react-router-dom'
import SectionHead from './SectionHead'
import { ArrowLeft, ChevronLeft, ChevronRight, Leaf } from './Icons'
import { PostCard } from './Cards'
import { useRouteData } from '../content/context'
import { FALLBACK_HOME } from '../content/fallback'
import { toPost } from '../content/adapters'
import type { HomeDTO } from '../content/types'
import { fa } from '../lib/fa'
import { useAutoplay, useNearViewport, useReveal, useCarouselPause } from '../lib/hooks'

export default function Articles() {
  const home = useRouteData<HomeDTO>()
  const POSTS = (home.status === 'ready' ? home.data.articles : FALLBACK_HOME.articles).map(toPost)
  const ref = useReveal<HTMLElement>()
  const [hover, pauseHandlers] = useCarouselPause()
  const N = POSTS.length
  const { index, go, next, prev } = useAutoplay(N, 4500, hover)
  const [cfRef, near] = useNearViewport<HTMLDivElement>()

  return (
    <section id="blog" className="section" ref={ref}>
      <div className="bg-shape shape-circle-green" />
      <Leaf className="leaf leaf-blog" />
      <div className="container">
        <SectionHead tag="مجلهٔ آموزشی" title="تازه‌ترین مقالات" text="مطالب کاربردی و به‌روز برای یادگیری بهتر زبان." />
        <div ref={cfRef} className="cf rv" {...pauseHandlers}>
          <button className="icon-btn nav-arrow nav-prev" onClick={prev} aria-label="مقالهٔ قبلی"><ChevronRight /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={next} aria-label="مقالهٔ بعدی"><ChevronLeft /></button>
          <div className="cf-stage">
            {POSTS.map((p, i) => {
              let off = (i - index + N) % N
              if (off > N / 2) off -= N
              const vis = Math.abs(off) <= 1
              return (
                <PostCard
                  key={p.key}
                  p={p}
                  linkable={off === 0}
                  load={near}
                  data-off={off}
                  style={{ '--o': off, opacity: vis ? 1 : 0, pointerEvents: vis ? 'auto' : 'none', zIndex: 10 - Math.abs(off) } as React.CSSProperties}
                  aria-hidden={!vis}
                  onClick={() => off !== 0 && go(i)}
                />
              )
            })}
          </div>
          <div className="dots" role="tablist" aria-label="انتخاب مقاله">
            {POSTS.map((p, i) => <button key={p.key} role="tab" aria-selected={i === index} aria-label={`مقالهٔ ${fa(i + 1)}`} className={i === index ? 'on' : ''} onClick={() => go(i)} />)}
          </div>
        </div>
        <div className="center rv"><Link to="/magazine" className="btn btn-dark">مشاهدهٔ همهٔ مقالات <ArrowLeft /></Link></div>
      </div>
    </section>
  )
}
