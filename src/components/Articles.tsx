import { useState } from 'react'
import SectionHead from './SectionHead'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from './Icons'
import { fa } from '../lib/fa'
import { useAutoplay, useReveal } from '../lib/hooks'

const POSTS = [
  { title: 'چگونه مهارت مکالمهٔ انگلیسی را تقویت کنیم؟', text: '۵ راهکار کاربردی برای صحبت روان‌تر و با اعتماد به نفس بیشتر.', min: 8, img: '/img/blog-english.webp', tag: 'محتوای آموزشی' },
  { title: 'اشتباهات رایج در یادگیری آلمانی', text: 'از این اشتباهات پرهیز کنید!', min: 6, img: '/img/blog-writing.webp', tag: 'زبان آلمانی' },
  { title: 'عبارات پرکاربرد در زبان فرانسه', text: 'عباراتی که در سفر و مکالمه به کارتان می‌آیند.', min: 7, img: '/img/blog-paris.webp', tag: 'زبان فرانسه' },
  { title: 'عادت‌های روزانه برای یادگیری سریع‌تر', text: 'با ده دقیقه تمرین هر روز، نتیجهٔ چشمگیری بگیرید.', min: 5, img: '/img/blog-book.webp', tag: 'یادگیری' },
  { title: 'بهترین ابزارهای آنلاین برای تمرین شنیداری', text: 'گوش‌دادن فعال را با این ابزارها تمرین کنید.', min: 6, img: '/img/blog-laptop.webp', tag: 'ابزار' },
]

export default function Articles() {
  const ref = useReveal<HTMLElement>()
  const [hover, setHover] = useState(false)
  const { index, go, next, prev } = useAutoplay(POSTS.length, 4500, hover)
  const N = POSTS.length

  return (
    <section id="blog" className="section" ref={ref}>
      <div className="bg-shape shape-circle-green" />
      <div className="container">
        <SectionHead tag="مجلهٔ آموزشی" title="آخرین مقالات بلاگ" text="مطالب کاربردی و به‌روز برای یادگیری بهتر زبان." />
        <div className="cf rv" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}>
          <button className="icon-btn nav-arrow nav-prev" onClick={next} aria-label="مقالهٔ بعدی"><ChevronLeft /></button>
          <button className="icon-btn nav-arrow nav-next" onClick={prev} aria-label="مقالهٔ قبلی"><ChevronRight /></button>
          <div className="cf-stage">
            {POSTS.map((p, i) => {
              let off = (i - index + N) % N
              if (off > N / 2) off -= N
              const vis = Math.abs(off) <= 1
              return (
                <article
                  key={p.title}
                  className="card post"
                  data-off={off}
                  style={{ '--o': off, opacity: vis ? 1 : 0, pointerEvents: vis ? 'auto' : 'none', zIndex: 10 - Math.abs(off) } as React.CSSProperties}
                  aria-hidden={!vis}
                  onClick={() => off !== 0 && go(i)}
                >
                  <div className="post-img">
                    <img src={p.img} alt="" loading="lazy" />
                    <span className="pill pill-sm">{p.tag}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  <div className="post-foot">
                    <span><Clock width={16} height={16} /> {fa(p.min)} دقیقه مطالعه</span>
                    <a href="#blog" tabIndex={off === 0 ? 0 : -1}>مطالعهٔ مقاله <ArrowLeft width={15} height={15} /></a>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="dots" role="tablist" aria-label="انتخاب مقاله">
            {POSTS.map((p, i) => <button key={p.title} role="tab" aria-selected={i === index} aria-label={`مقالهٔ ${fa(i + 1)}`} className={i === index ? 'on' : ''} onClick={() => go(i)} />)}
          </div>
        </div>
        <div className="center rv"><a href="#blog" className="btn btn-dark">مشاهدهٔ همهٔ مقالات <ArrowLeft /></a></div>
      </div>
    </section>
  )
}
