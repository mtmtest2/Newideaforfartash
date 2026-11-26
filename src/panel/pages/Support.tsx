import { useState, type FormEvent } from 'react'
import { CONTACT } from '../../components/Footer'
import { formatDate } from '../../lib/jalali'
import { usePanel } from '../context'
import { fieldError } from '../hooks'
import { Chip, Icon, Modal } from '../ui'

const STATUS = { open: ['در حال بررسی', 'warn'], answered: ['پاسخ داده شد', 'ok'], closed: ['بسته‌شده', 'muted'] } as const

export default function Support() {
  const { tickets, addTicket } = usePanel()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<{ field: 'subject' | 'message'; msg: string } | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const subject = String(f.get('subject') || '').trim(), message = String(f.get('message') || '').trim()
    const fail = (field: 'subject' | 'message', msg: string) => { setErr({ field, msg }); fieldError(e.currentTarget, field) }
    if (!subject) return fail('subject', 'موضوع درخواست را بنویسید؛ مثلاً «جابه‌جایی ساعت کلاس».')
    if (message.length < 10) return fail('message', 'توضیح را کامل‌تر بنویسید؛ دست‌کم ۱۰ حرف.')
    setErr(null)
    addTicket({ subject, dept: String(f.get('dept')), last: message })
    setOpen(false); setSent(true)
  }

  return (
    <div className="p-page">
      <div className="p-support-top">
        <div className="p-card p-contact-card">
          <span className="p-stat-ico">{Icon.support()}</span>
          <div><b>نیاز به کمک فوری دارید؟</b><small>شنبه تا پنجشنبه، ۹ تا ۲۱</small></div>
          <a className="btn btn-ghost btn-sm" href={`tel:${CONTACT.phone}`}><bdi dir="ltr">{CONTACT.phoneDisplay}</bdi></a>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { setOpen(true); setSent(false) }}>{Icon.plus(20)} درخواست جدید</button>
      </div>
      {sent && <p className="ok" role="status">درخواست شما ثبت شد. پاسخ را همین‌جا و با پیامک اطلاع می‌دهیم.</p>}

      <section className="p-card">
        <header className="p-card-head"><h2>درخواست‌های پشتیبانی</h2></header>
        <ul className="p-tickets">
          {tickets.map((t) => (
            <li key={t.id}>
              <div className="p-ticket-top">
                <b>{t.subject}</b>
                <Chip tone={STATUS[t.status][1]}>{STATUS[t.status][0]}</Chip>
              </div>
              <p>{t.last}</p>
              <small className="p-muted"><bdi dir="ltr">{t.id}</bdi> • واحد {t.dept} • {formatDate(t.date)}</small>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={open} onClose={() => { setOpen(false); setErr(null) }} title="درخواست پشتیبانی جدید">
        <form className="p-form" onSubmit={submit} noValidate>
          <label className="p-field"><span>واحد</span>
            <select name="dept" defaultValue="آموزش"><option>آموزش</option><option>مالی</option><option>فنی</option></select>
          </label>
          <label className="p-field"><span>موضوع</span><input name="subject" autoComplete="off" placeholder="مثلاً جابه‌جایی ساعت کلاس…" aria-invalid={err?.field === 'subject'} aria-describedby={err?.field === 'subject' ? 'err-subject' : undefined} />
            {err?.field === 'subject' && <small className="err" id="err-subject" role="alert">{err.msg}</small>}</label>
          <label className="p-field"><span>توضیح</span><textarea name="message" rows={5} placeholder="درخواستتان را کامل بنویسید…" aria-invalid={err?.field === 'message'} aria-describedby={err?.field === 'message' ? 'err-message' : undefined} />
            {err?.field === 'message' && <small className="err" id="err-message" role="alert">{err.msg}</small>}</label>
          <button type="submit" className="btn btn-primary btn-block">ثبت درخواست</button>
        </form>
      </Modal>
    </div>
  )
}
