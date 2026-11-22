import SectionHead from './SectionHead'
import { ArrowLeft, Chart, Chat, Clipboard, Screen, Teacher, Trophy, Leaf } from './Icons'
import { fa } from '../lib/fa'
import { useReveal } from '../lib/hooks'

const STEPS = [
  { icon: <Clipboard />, title: 'ثبت‌نام و انتخاب دوره', text: 'به‌راحتی ثبت‌نام کنید و دورهٔ مورد نظر خود را انتخاب کنید.' },
  { icon: <Chart />, title: 'تعیین سطح', text: 'سطح زبان خود را مشخص کنید تا در مسیر مناسب قرار بگیرید.' },
  { icon: <Screen />, title: 'شروع کلاس زنده', text: 'در کلاس‌های آنلاین کوچک و تعاملی شرکت کنید.' },
  { icon: <Chat />, title: 'تمرین و تثبیت آموخته‌ها', text: 'با تمرین‌های هدفمند، آموخته‌های خود را مرور کنید.' },
  { icon: <Teacher />, title: 'ارتباط با استاد', text: 'سؤالات خود را بپرسید و از راهنمایی استاد بهره‌مند شوید.' },
  { icon: <Trophy />, title: 'رسیدن به هدف', text: 'با اعتماد به نفس صحبت کنید و بدرخشید.' },
]

export default function Steps() {
  const ref = useReveal<HTMLElement>()
  return (
    <section id="steps" className="section steps" ref={ref}>
      <Leaf className="leaf leaf-steps" />
      <div className="bg-shape shape-arc" />
      <div className="container">
        <SectionHead tag="چطور شروع کنیم؟" title="مسیر یادگیری با فرتاش" text="از اولین قدم تا صحبت روان، در کنار شما هستیم." />
        <ol className="step-list">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step rv" style={{ '--d': `${i * 90}ms` } as React.CSSProperties}>
              <span className="step-num">{fa(i + 1)}</span>
              <span className="step-ico">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="center rv"><a href="#contact" className="btn btn-primary">همین حالا شروع کنید <ArrowLeft /></a></div>
      </div>
    </section>
  )
}
