import { useState, type FormEvent } from 'react'
import { fa } from '../../lib/fa'
import { formatDate } from '../../lib/jalali'
import { fieldError } from '../../panel/hooks'
import { ThemeSection } from '../../panel/pages/Profile'
import { updateTeacher } from '../../panel/session'
import { Icon, initials } from '../../panel/ui'
import { useTeacherPanel } from '../context'

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const { session, teacher, courses } = useTeacherPanel()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    if (!name) { setErr('نام و نام‌خانوادگی را وارد کنید.'); return fieldError(e.currentTarget, 'name') }
    setErr('')
    updateTeacher({ name, bio: String(f.get('bio') || '').trim(), notifySms: f.get('sms') === 'on' })
    setSaved(true); window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-page p-profile">
      <section className="p-card p-profile-head">
        <span className="p-avatar p-avatar-lg" aria-hidden="true">{initials(session.name)}</span>
        <div>
          <h2>استاد {session.name}</h2>
          <p className="p-muted">{teacher.title} • {fa(courses.length)} کلاس</p>
          <p className="p-muted">همکاری با فرتاش از {formatDate(new Date(session.joined))}</p>
        </div>
      </section>

      <form className="p-card p-form" onSubmit={save} noValidate>
        <h2 className="p-section-title">اطلاعات حساب</h2>
        <div className="p-form-grid">
          <label className="p-field"><span>نام و نام‌خانوادگی</span><input name="name" defaultValue={session.name} autoComplete="name" aria-invalid={!!err} aria-describedby={err ? 'err-name' : undefined} />
            {err && <small className="err" id="err-name" role="alert">{err}</small>}</label>
          <label className="p-field"><span>شمارهٔ موبایل</span><input value={fa(session.phone)} readOnly dir="ltr" className="ltr-in" aria-describedby="t-phone-help" /><small id="t-phone-help" className="p-muted">برای تغییر شماره با مدیر آموزش تماس بگیرید.</small></label>
        </div>
        <label className="p-field"><span>معرفی کوتاه</span><textarea name="bio" rows={3} defaultValue={session.bio} placeholder="مثلاً ده سال سابقهٔ تدریس مکالمه و آمادگی آیلتس…" /><small className="p-muted">این متن در صفحهٔ اساتید سایت نشان داده می‌شود.</small></label>
        <h2 className="p-section-title">اعلان‌ها</h2>
        <label className="p-switch"><input type="checkbox" name="sms" defaultChecked={session.notifySms ?? true} /><span className="p-switch-ui" aria-hidden="true" /><span><b>پیامک پاسخ و پیام تازه</b><small>وقتی زبان‌آموزی پاسخ تکلیف یا پیام می‌فرستد، پیامک می‌گیرید.</small></span></label>
        {saved && <p className="ok" role="status">تغییرات ذخیره شد.</p>}
        <button type="submit" className="btn btn-primary">ذخیرهٔ تغییرات</button>
      </form>

      <ThemeSection />

      <button type="button" className="btn btn-ghost p-logout" onClick={onLogout}>{Icon.logout(20)} خروج از حساب کاربری</button>
    </div>
  )
}
