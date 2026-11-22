import { useEffect, useRef, useState } from 'react'
import SectionHead from './SectionHead'
import { Leaf } from './Icons'
import { useReveal } from '../lib/hooks'

export default function IntroVideo() {
  const ref = useReveal<HTMLElement>()
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  // Play muted while on screen, pause when scrolled away (saves battery and data).
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.45 })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  return (
    <section id="intro" className="section" ref={ref}>
      <Leaf className="leaf leaf-video" />
      <div className="container">
        <SectionHead tag="معرفی کلاس آنلاین" title="کلاس آنلاین فرتاش در یک نگاه" text="کلاس زنده، اساتید مجرب، تمرین هدفمند و پیگیری پیشرفت؛ همه در یک ویدیوی کوتاه." />
        <div className="video-card rv">
          <video
            ref={video}
            src="/video/fartash-intro.mp4"
            poster="/video/fartash-intro-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={toggle}
            aria-label="موشن‌گرافی معرفی امکانات کلاس آنلاین فرتاش"
          />
          <button type="button" className={`video-btn${playing ? ' is-playing' : ''}`} onClick={toggle} aria-label={playing ? 'توقف ویدیو' : 'پخش ویدیو'}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
