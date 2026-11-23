import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Classes from '../components/Classes'
import Steps from '../components/Steps'
import Articles from '../components/Articles'
import Testimonials from '../components/Testimonials'
import Faq from '../components/Faq'
import IntroVideo from '../components/IntroVideo'
import BottomNav from '../components/BottomNav'
import Footer, { Cta } from '../components/Footer'
import { useReveal } from '../lib/hooks'

export default function Home() {
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
        <Classes />
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
