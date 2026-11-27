import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Classes, { CoursesCarousel } from '../components/Classes'
import SectionHead from '../components/SectionHead'
import { EventCard } from './content/Events'
import { useRouteData } from '../content/context'
import type { HomeDTO } from '../content/types'
import Steps from '../components/Steps'
import Articles from '../components/Articles'
import Testimonials from '../components/Testimonials'
import Faq from '../components/Faq'
import IntroVideo from '../components/IntroVideo'
import BottomNav from '../components/BottomNav'
import Footer, { Cta } from '../components/Footer'
import { useReveal } from '../lib/hooks'

export default function Home() {
  const home = useRouteData<HomeDTO>()
  const courses = home.status === 'ready' ? home.data.courses : undefined
  const events = home.status === 'ready' ? home.data.events : undefined
  const coursesAt = (pos: string) => (courses && courses.items.length && courses.position === pos ? <CoursesCarousel section={courses} /> : null)
  const ref = useReveal<HTMLDivElement>()
  const { hash, key } = useLocation()
  // Scroll to the section named in the hash. Keep the effect body in braces: window.scrollTo returns a
  // Promise in recent Chrome, and returning it from an effect makes React call it as a cleanup and crash.
  useEffect(() => {
    if (!hash || hash === '#home') {
      window.scrollTo({ top: 0 })
    } else {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    }
  }, [hash, key])
  useEffect(() => {
    document.title = 'فرتاش | آموزشگاه آنلاین زبان'
  }, [])
  return (
    <>
      <Header />
      <main ref={ref}>
        <Hero />
        <Steps />
        <IntroVideo />
        {coursesAt('afterIntro')}
        <Classes />
        {coursesAt('afterClasses')}
        {events && events.items.length > 0 && (
          <section id="events" className="section">
            <div className="container">
              <SectionHead tag="فرتاش" title={events.title ?? 'کارگاه‌ها و رویدادها'} />
              <div className="post-grid">{events.items.map((e) => <EventCard key={e.slug} e={e} />)}</div>
            </div>
          </section>
        )}
        {coursesAt('beforeArticles')}
        <Articles />
        <Testimonials />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
