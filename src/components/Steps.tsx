import { Link } from 'react-router-dom'
import SectionHead from './SectionHead'
import { ArrowLeft, Chart, Clipboard, Screen, Teacher, Trophy, Leaf } from './Icons'
import { fa } from '../lib/fa'
import { useReveal } from '../lib/hooks'

const STEPS = [
  { icon: <Clipboard />, title: 'ثبت‌نام اولیه', text: 'در چند دقیقه حساب کاربری بسازید و زبان مورد نظرتان را انتخاب کنید.' },
  { icon: <Chart />, title: 'تعیین سطح رایگان', text: 'در یک جلسهٔ کوتاه و رایگان، سطح دقیق زبان شما مشخص می‌شود.' },
  { icon: <Teacher />, title: 'انتخاب کلاس مناسب', text: 'بر اساس سطح و هدفتان، کلاس و استاد مناسب را پیشنهاد می‌دهیم.' },
  { icon: <Screen />, title: 'برگزاری کلاس‌ها', text: 'کلاس‌های زنده و تعاملی، همراه با تمرین و پیگیری پیشرفت.' },
  { icon: <Trophy />, title: 'کسب گواهی پایان دوره', text: 'پس از پایان دوره، گواهی معتبر فرتاش را دریافت کنید.' },
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
        <div className="center rv"><Link to="/placement" className="btn btn-primary">تعیین سطح رایگان <ArrowLeft /></Link></div>
      </div>
    </section>
  )
}
