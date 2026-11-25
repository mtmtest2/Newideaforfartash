import SectionHead from './SectionHead'
import { ChevronLeft, ChevronRight, Star, Leaf } from './Icons'
import { useAutoplay, useReveal, useCarouselPause } from '../lib/hooks'
import av_amir from '../assets/img/av-amir.webp'
import av_sara from '../assets/img/av-sara.webp'
import av_woman from '../assets/img/av-woman.webp'
import av_man from '../assets/img/av-man.webp'

const ITEMS = [
  { name: 'امیر حسینی‌زاد', role: 'دورهٔ انگلیسی • کسب‌وکار', img: av_amir, text: 'دنبال دوره‌ای بودم که بتوانم انگلیسی را کنار کار و درسم جدی دنبال کنم و فرتاش دقیقاً همین بود. استادها همیشه در دسترس بودند و با حوصله به سؤال‌هایم جواب می‌دادند.' },
  { name: 'سارا رضایی', role: 'دورهٔ مکالمهٔ پیشرفتهٔ انگلیسی', img: av_sara, text: 'در دورهٔ مکالمهٔ پیشرفته شرکت کردم و از کیفیت مطالب و نظم برنامهٔ دوره واقعاً راضی بودم. حالا با اطمینان خیلی بیشتری انگلیسی صحبت می‌کنم.' },
  { name: 'نگار احمدی', role: 'دورهٔ آلمانی • مهاجرت', img: av_woman, text: 'کلاس‌های کوچک و تعاملی باعث شد از همان جلسهٔ اول جرأت صحبت کردن پیدا کنم. استادم همیشه بازخورد دقیق و به‌موقع می‌داد.' },
  { name: 'پویا کریمی', role: 'دورهٔ فرانسوی • تحصیل', img: av_man, text: 'برنامهٔ مرتب و تمرین‌های هدفمند کمک کرد در شش ماه به سطح مورد نیاز دلف برسم. پشتیبانی هم همیشه در دسترس بود.' },
]

export default function Testimonials() {
  const ref = useReveal<HTMLElement>()
  const [hover, pauseHandlers] = useCarouselPause()
  const { index, go, next, prev } = useAutoplay(ITEMS.length, 6000, hover)
  const pair = [ITEMS[index], ITEMS[(index + 1) % ITEMS.length]]

  return (
    <section id="testimonials" className="section testi" ref={ref}>
      <div className="bg-shape shape-circle-navy shape-end" />
      <Leaf className="leaf leaf-testi" />
      <div className="container">
        <div className="testi-top rv">
          <SectionHead tag="نظرات زبان‌آموزان" title="داستان موفقیت زبان‌آموزان فرتاش" text="نظر شما برایمان مهم است؛ می‌خواهیم مطمئن شویم از وقتی که برای یادگیری می‌گذارید، بهترین نتیجه را می‌گیرید." />
          <div className="arrows">
            <button className="icon-btn ring" onClick={prev} aria-label="نظر قبلی"><ChevronRight /></button>
            <button className="icon-btn ring" onClick={next} aria-label="نظر بعدی"><ChevronLeft /></button>
          </div>
        </div>
        <div className="testi-grid rv" {...pauseHandlers}>
          {pair.map((t, k) => (
            <figure key={`${index}-${k}`} className="card quote" style={{ '--d': `${k * 90}ms` } as React.CSSProperties}>
              <div className="quote-top">
                <span className="stars" role="img" aria-label="امتیاز ۵ از ۵">{Array.from({ length: 5 }, (_, s) => <Star key={s} width={20} height={20} />)}</span>
                <span className="qmark" aria-hidden="true">”</span>
              </div>
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <img src={t.img} alt="" width={56} height={56} loading="lazy" />
                <span><b>{t.name}</b><small>{t.role}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="dots rv" role="tablist" aria-label="انتخاب نظر">
          {ITEMS.map((t, i) => <button key={t.name} role="tab" aria-selected={i === index} aria-label={`نظر ${t.name}`} className={i === index ? 'on' : ''} onClick={() => go(i)} />)}
        </div>
      </div>
    </section>
  )
}
