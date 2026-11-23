import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HERO, LOGO } from '../assets'
import { ArrowLeft, Bars, Chart, Headset, Mentors, Play, Spark, Leaf } from './Icons'
import { fa } from '../lib/fa'
import { useReveal } from '../lib/hooks'

const FEATURES = [
  { icon: <Play width={44} height={44} />, title: 'کلاس‌های زنده', text: 'با برنامهٔ خودتان یاد بگیرید.' },
  { icon: <Mentors width={44} height={44} />, title: 'اساتید مجرب', text: 'راهنمایی مستقیم از اهل فن.' },
  { icon: <Chart width={44} height={44} />, title: 'پیگیری پیشرفت', text: 'رشد خودتان را ببینید.' },
  { icon: <Headset width={44} height={44} />, title: 'پشتیبانی هر روزه', text: 'همیشه کنار شما هستیم.' },
]

/** After the page has loaded, fetch the other theme's hero + logo in idle time so toggling is instant. */
function usePrefetchOtherTheme() {
  useEffect(() => {
    const run = () => {
      const other = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
      const img = new Image()
      img.sizes = HERO[other].sizes
      img.srcset = HERO[other].srcSet
      new Image().src = LOGO[other]
    }
    const idle = (cb: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 2500))
    if (document.readyState === 'complete') idle(run)
    else window.addEventListener('load', () => idle(run), { once: true })
  }, [])
}

export default function Hero() {
  const ref = useReveal<HTMLElement>()
  usePrefetchOtherTheme()
  return (
    <section id="home" className="hero" ref={ref}>
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-in" style={{ '--d': '0ms' } as React.CSSProperties}>
            <Spark className="spark" /> همراه آنلاین یادگیری شما
          </p>
          <h1 className="hero-in" style={{ '--d': '120ms' } as React.CSSProperties}>
            بیا <span className="hl">یک جور دیگه</span>
            <br />
            حرف بزنیم
          </h1>
          <p className="lead hero-in" style={{ '--d': '240ms' } as React.CSSProperties}>
            هر زمان و هر جا به کلاس‌های باکیفیت دسترسی داشته باش و مسیر یادگیری‌ات را راحت و با اطمینان پیش ببر.
          </p>
          <div className="hero-cta hero-in" style={{ '--d': '360ms' } as React.CSSProperties}>
            <Link to="/placement" className="btn btn-primary btn-lg">
              تعیین سطح رایگان <ArrowLeft />
            </Link>
          </div>
        </div>

        <div className="hero-visual hero-in" style={{ '--d': '200ms' } as React.CSSProperties}>
          <svg className="orbit orbit-a" viewBox="0 0 400 300" aria-hidden="true"><path d="M20 60C60 -10 220 -20 300 60S380 240 330 280" /></svg>
          <svg className="orbit orbit-b" viewBox="0 0 400 300" aria-hidden="true"><path d="M10 270C120 220 260 200 390 130" /></svg>
          <div className="arch arch-green" />
          <div className="arch arch-navy" />
          {/* Day: the boy, night: the girl, swapped by CSS on [data-theme]. The inactive one is display:none and
              lazy, so it isn't downloaded on first load; the head script preloads the active one, and the other
              is fetched when the page is idle so the swap animation stays instant. */}
          <div className="hero-swap swap-day">
            <img className="hero-person" srcSet={HERO.light.srcSet} sizes={HERO.light.sizes} src={HERO.light.src} width={HERO.light.width} height={HERO.light.height} loading="lazy" alt="" />
          </div>
          <div className="hero-swap swap-night">
            <img className="hero-person" srcSet={HERO.dark.srcSet} sizes={HERO.dark.sizes} src={HERO.dark.src} width={HERO.dark.width} height={HERO.dark.height} loading="lazy" alt="" />
          </div>
          <div className="stat-chip">
            <Bars className="stat-ico" width={30} height={30} />
            <div>
              <span>تعداد دوره‌ها</span>
              <strong>{fa('1,200').replace(',', '٬')}+</strong>
            </div>
          </div>
          <Leaf className="leaf leaf-hero" />
        </div>
      </div>

      <div className="container">
        <ul className="features rv">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <span className="feat-ico">{f.icon}</span>
              <div>
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
