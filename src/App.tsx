import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import Classes from './components/Classes'
import Steps from './components/Steps'
import Articles from './components/Articles'
import Testimonials from './components/Testimonials'
import Faq from './components/Faq'
import IntroVideo from './components/IntroVideo'
import BottomNav from './components/BottomNav'
import Footer, { Cta } from './components/Footer'
import Login from './pages/Login'
import { useReveal } from './lib/hooks'

function Home() {
  const ref = useReveal<HTMLDivElement>()
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return window.scrollTo(0, 0)
    document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
