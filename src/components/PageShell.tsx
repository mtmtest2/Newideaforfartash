import { useEffect, type ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import SectionHead from './SectionHead'
import { Leaf } from './Icons'
import { useReveal } from '../lib/hooks'

/** Layout for the inner pages: header, a titled section, footer and the phone tab bar. */
export default function PageShell({ tag, title, text, docTitle, children }: { tag: string; title: string; text?: string; docTitle?: string; children: ReactNode }) {
  const ref = useReveal<HTMLElement>()
  useEffect(() => {
    window.scrollTo({ top: 0 })
    const t = docTitle ?? title
    document.title = t.includes('فرتاش') ? t : `${t} | فرتاش`
  }, [title, docTitle])
  return (
    <>
      <Header />
      <main>
        <section className="section page" ref={ref}>
          <div className="bg-shape shape-circle-green" />
          <Leaf className="leaf leaf-page" />
          <div className="container">
            <SectionHead tag={tag} title={title} text={text} />
            {children}
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
