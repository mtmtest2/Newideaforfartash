import { useEffect, useRef, useState } from 'react'
import SectionHead from './SectionHead'
import { Leaf } from './Icons'
import { useReveal } from '../lib/hooks'
import { INTRO_VIDEO } from '../assets'

type Sources = { src: string; poster: string }

export default function IntroVideo() {
  const ref = useReveal<HTMLElement>()
  const card = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [sources, setSources] = useState<Sources | null>(null)

  // The video is far below the fold: attach its source and poster only when the section is about one
  // screen away, and pick 720p for phone-sized viewports (or Data Saver) and 1080p otherwise.
  useEffect(() => {
    const el = card.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
      const small = saveData || window.innerWidth <= 900
      setSources(small ? { src: INTRO_VIDEO.small, poster: INTRO_VIDEO.posterSmall } : { src: INTRO_VIDEO.large, poster: INTRO_VIDEO.posterLarge })
    }, { rootMargin: '100% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Play muted while on screen, pause when scrolled away (saves battery and data).
  useEffect(() => {
    const v = video.current
    if (!v || !sources) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.45 })
    io.observe(v)
    return () => io.disconnect()
  }, [sources])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const toggleSound = () => {
    const v = video.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    if (!v.muted && v.paused) v.play().catch(() => {})
  }

  return (
    <section id="intro" className="section" ref={ref}>
      <Leaf className="leaf leaf-video" />
      <div className="container">
        <SectionHead tag="معرفی دوره‌ها" title="دوره‌های آنلاین و آفلاین فرتاش" text="تفاوت کلاس‌های زندهٔ آنلاین با دوره‌های ضبط‌شدهٔ آفلاین و مزایای هر کدام، در کمتر از دو دقیقه." />
        <div className="video-card rv" ref={card}>
          <video
            ref={video}
            src={sources?.src}
            poster={sources?.poster}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={toggle}
            aria-label="موشن‌گرافی معرفی دوره‌های آنلاین و آفلاین فرتاش"
          />
          <button type="button" className={`video-btn${playing ? ' is-playing' : ''}`} onClick={toggle} aria-label={playing ? 'توقف ویدیو' : 'پخش ویدیو'}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            )}
          </button>
          <button type="button" className="sound-btn" onClick={toggleSound} aria-label={muted ? 'روشن کردن صدا' : 'بی‌صدا کردن'} aria-pressed={!muted}>
            {muted ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
            )}
            <span>{muted ? 'پخش با صدا' : 'صدا روشن است'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
