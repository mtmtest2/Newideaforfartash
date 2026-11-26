import { useState } from 'react'
import { faMoney } from '../../lib/fa'
import { formatDate, relativeDay } from '../../lib/jalali'
import type { Invoice } from '../data'
import { usePanel } from '../context'
import { Chip, Icon, Modal } from '../ui'

export default function Payments() {
  const { demo, session } = usePanel()
  const [inv, setInv] = useState<Invoice | null>(null)
  const [paying, setPaying] = useState(false)
  const paid = demo.invoices.filter((i) => i.status === 'paid')
  const due = demo.invoices.filter((i) => i.status === 'due')
  const total = paid.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-page">
      <section className="p-stats p-stats-3">
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.wallet()}</span><b className="p-money">{faMoney(total)}</b><small>جمع پرداخت‌ها</small></div>
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.receipt()}</span><b>{paid.length.toLocaleString('fa-IR')}</b><small>فاکتور پرداخت‌شده</small></div>
        {due[0] && (
          <div className="p-card p-stat p-due">
            <span className="p-stat-ico">{Icon.clock()}</span>
            <b className="p-money">{faMoney(due[0].amount)}</b>
            <small>قسط بعدی • مهلت {relativeDay(due[0].date, demo.now)}</small>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setPaying(true)}>پرداخت آنلاین</button>
          </div>
        )}
      </section>

      <section className="p-card">
        <header className="p-card-head"><h2>فاکتورها</h2></header>
        <div className="p-table-wrap">
          <table className="p-table">
            <thead><tr><th scope="col">شماره</th><th scope="col">شرح</th><th scope="col">تاریخ</th><th scope="col">مبلغ</th><th scope="col">وضعیت</th><th scope="col"><span className="sr">جزئیات</span></th></tr></thead>
            <tbody>
              {[...demo.invoices].sort((a, b) => b.date.getTime() - a.date.getTime()).map((i) => (
                <tr key={i.id}>
                  <td><bdi dir="ltr">{i.id}</bdi></td>
                  <td>{i.title}</td>
                  <td>{formatDate(i.date)}</td>
                  <td className="p-num">{faMoney(i.amount)}</td>
                  <td>{i.status === 'paid' ? <Chip tone="ok">پرداخت‌شده</Chip> : <Chip tone="warn">در انتظار پرداخت</Chip>}</td>
                  <td><button type="button" className="p-link" onClick={() => setInv(i)}>مشاهده</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!inv} onClose={() => setInv(null)} title={`فاکتور ${inv?.id ?? ''}`}>
        {inv && (
          <div className="p-invoice" id="invoice">
            <dl>
              <dt>نام زبان‌آموز</dt><dd>{session.name}</dd>
              <dt>شرح</dt><dd>{inv.title}</dd>
              <dt>تاریخ</dt><dd>{formatDate(inv.date)}</dd>
              <dt>روش پرداخت</dt><dd>{inv.method ?? '—'}</dd>
              <dt>وضعیت</dt><dd>{inv.status === 'paid' ? 'پرداخت‌شده' : 'در انتظار پرداخت'}</dd>
              <dt>مبلغ</dt><dd className="p-money">{faMoney(inv.amount)}</dd>
            </dl>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => window.print()}>{Icon.print(20)} چاپ فاکتور</button>
          </div>
        )}
      </Modal>
      <Modal open={paying} onClose={() => setPaying(false)} title="پرداخت آنلاین">
        <p className="p-modal-text">در نسخهٔ نهایی، با این دکمه به درگاه پرداخت بانکی منتقل می‌شوید. این نسخه نمایشی است و هنوز به درگاه پرداخت وصل نشده است.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => setPaying(false)}>متوجه شدم</button>
      </Modal>
    </div>
  )
}
