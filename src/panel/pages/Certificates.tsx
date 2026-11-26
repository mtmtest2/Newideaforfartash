import { useState } from 'react'
import { fa } from '../../lib/fa'
import { formatDate } from '../../lib/jalali'
import { LOGO } from '../../assets'
import { COURSES } from '../data'
import { usePanel } from '../context'
import { Bar, Icon, Modal } from '../ui'

export default function Certificates() {
  const { session, demo } = usePanel()
  const [open, setOpen] = useState<string | null>(null)
  const cert = demo.certificates.find((c) => c.id === open)

  return (
    <div className="p-page">
      <section>
        <h2 className="p-section-title">گواهی‌های دریافت‌شده</h2>
        <div className="p-cert-grid earned">
          {demo.certificates.map((c) => (
            <article key={c.id} className="p-card p-cert">
              <span className="p-cert-ico">{Icon.award(34)}</span>
              <div>
                <h3>گواهی پایان دورهٔ {c.title} <bdi>{c.level}</bdi></h3>
                <p className="p-muted">صادرشده در {formatDate(c.date)} • {fa(c.hours)} ساعت آموزش • نمرهٔ نهایی {fa(String(c.score)).replace('.', '٫')}</p>
                <p className="p-cert-id">شمارهٔ گواهی: <bdi dir="ltr">{c.id}</bdi></p>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(c.id)}>نمایش و چاپ</button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="p-section-title">در مسیر گواهی</h2>
        <div className="p-cert-grid">
          {COURSES.map((c) => (
            <article key={c.id} className="p-card p-cert locked">
              <span className="p-cert-ico">{Icon.lock(28)}</span>
              <div>
                <h3>{c.title} <bdi>{c.level}</bdi></h3>
                <p className="p-muted">{fa(c.sessions - c.done)} جلسهٔ دیگر تا دریافت گواهی</p>
                <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal open={!!cert} onClose={() => setOpen(null)} title="گواهی پایان دوره" wide>
        {cert && (
          <>
            <div className="p-certificate" id="certificate">
              <img className="p-certificate-logo" src={LOGO.light} alt="فرتاش" width={LOGO.width} height={LOGO.height} />
              <p className="p-certificate-kicker">گواهی پایان دوره</p>
              <p>بدین‌وسیله گواهی می‌شود</p>
              <h3>{session.name}</h3>
              <p>دورهٔ <b>{cert.title} سطح <bdi>{cert.level}</bdi></b> را به مدت {fa(cert.hours)} ساعت در آموزشگاه آنلاین زبان فرتاش با نمرهٔ {fa(String(cert.score)).replace('.', '٫')} از ۲۰ با موفقیت به پایان رسانده است.</p>
              <div className="p-certificate-foot">
                <span>تاریخ صدور<br /><b>{formatDate(cert.date)}</b></span>
                <span>شمارهٔ گواهی<br /><b dir="ltr">{cert.id}</b></span>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={() => window.print()}>{Icon.print(20)} چاپ یا ذخیره به‌صورت PDF</button>
          </>
        )}
      </Modal>
    </div>
  )
}
