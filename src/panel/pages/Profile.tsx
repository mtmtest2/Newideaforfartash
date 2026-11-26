import { useState, type FormEvent } from 'react'
import { fa } from '../../lib/fa'
import { formatDate } from '../../lib/jalali'
import { useTheme } from '../../lib/hooks'
import { updateSession } from '../session'
import { usePanel } from '../context'
import { Icon, initials } from '../ui'
import { Moon, Sun } from '../../components/Icons'

const GOALS = ['مکالمهٔ روزمره', 'مهاجرت', 'تحصیل', 'کار', 'آزمون بین‌المللی', 'علاقهٔ شخصی']

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const { session } = usePanel()
  const { theme, toggle } = useTheme()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const email = String(f.get('email') || '').trim()
    if (!name) return setErr('نام و نام‌خانوادگی را وارد کنید.')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('ایمیل معتبر نیست؛ مثلاً name@example.com')
    setErr('')
    updateSession({ name, email, goal: String(f.get('goal')), notifySms: f.get('sms') === 'on', notifyEmail: f.get('mail') === 'on' })
    setSaved(true); window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-page p-profile">
      <section className="p-card p-profile-head">
        <span className="p-avatar p-avatar-lg" aria-hidden="true">{initials(session.name)}</span>
        <div>
          <h2>{session.name}</h2>
          <p className="p-muted">زبان‌آموز فرتاش از {formatDate(new Date(session.joined))}</p>
          <p className="p-muted"><bdi dir="ltr">{fa(session.phone)}</bdi></p>
        </div>
      </section>

      <form className="p-card p-form" onSubmit={save} noValidate>
        <h2 className="p-section-title">اطلاعات شخصی</h2>
        <div className="p-form-grid">
          <label className="p-field"><span>نام و نام‌خانوادگی</span><input name="name" defaultValue={session.name} autoComplete="name" /></label>
          <label className="p-field"><span>شمارهٔ موبایل</span><input value={fa(session.phone)} readOnly dir="ltr" className="ltr-in" aria-describedby="phone-help" /><small id="phone-help" className="p-muted">برای تغییر شماره با پشتیبانی تماس بگیرید.</small></label>
          <label className="p-field"><span>ایمیل (اختیاری)</span><input name="email" type="email" defaultValue={session.email} dir="ltr" className="ltr-in" placeholder="name@example.com" autoComplete="email" /></label>
          <label className="p-field"><span>هدف از یادگیری</span>
            <select name="goal" defaultValue={session.goal ?? GOALS[0]}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select>
          </label>
        </div>

        <h2 className="p-section-title">اعلان‌ها</h2>
        <label className="p-switch"><input type="checkbox" name="sms" defaultChecked={session.notifySms ?? true} /><span className="p-switch-ui" aria-hidden="true" /><span><b>یادآوری پیامکی کلاس‌ها</b><small>یک ساعت پیش از هر کلاس پیامک دریافت می‌کنید.</small></span></label>
        <label className="p-switch"><input type="checkbox" name="mail" defaultChecked={session.notifyEmail ?? false} /><span className="p-switch-ui" aria-hidden="true" /><span><b>خبرنامهٔ ایمیلی</b><small>مقاله‌های تازه و کارگاه‌های رایگان را ایمیل می‌کنیم.</small></span></label>

        {err && <p className="err" role="alert">{err}</p>}
        {saved && <p className="ok" role="status">تغییرات ذخیره شد.</p>}
        <button type="submit" className="btn btn-primary">ذخیرهٔ تغییرات</button>
      </form>

      <section className="p-card">
        <h2 className="p-section-title">ظاهر</h2>
        <div className="p-theme-pick" role="radiogroup" aria-label="حالت نمایش">
          <button type="button" role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => theme !== 'light' && toggle()}><Sun width={20} height={20} /> حالت روز</button>
          <button type="button" role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => theme !== 'dark' && toggle()}><Moon width={20} height={20} /> حالت شب</button>
        </div>
      </section>

      <button type="button" className="btn btn-ghost p-logout" onClick={onLogout}>{Icon.logout(20)} خروج از حساب کاربری</button>
    </div>
  )
}
