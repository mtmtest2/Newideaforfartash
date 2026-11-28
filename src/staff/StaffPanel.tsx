// Owner (/owner), support (/support-desk) and supervisor (/supervisor) dashboards — a first, deliberately simple
// version to discuss with the school: real accounts and real numbers, plus a list of proposed modules that are
// clearly marked as not built yet. The server guard (server/auth.mjs) already refused anyone without this role.
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { fa } from '../lib/fa'
import Shell, { Skeleton, type NavItem } from '../panel/Shell'
import { Chip, Empty, Icon, Modal } from '../panel/ui'
import { api, authApi, ensureStaff, logoutStaff, type StaffRole, type StaffUser } from '../auth/client'
import { ChangePassword, OneTimeSecret, ROLE_LABEL, RoleChip, RowActions, StatusChips, fmtCount, suggestPassword, useLoad, when, type Overview, type Row } from './parts'

type Area = 'owner' | 'support' | 'supervisor'
const BASE: Record<Area, string> = { owner: '/owner', support: '/support-desk', supervisor: '/supervisor' }
const APP: Record<Area, string> = { owner: 'داشبورد مالک فرتاش', support: 'داشبورد پشتیبانی فرتاش', supervisor: 'داشبورد سوپروایزر فرتاش' }

/** Modules proposed for discussion with the school — nothing here is built yet. */
const IDEAS: Record<Area, { title: string; text: string }[]> = {
  owner: [
    { title: 'گزارش مالی', text: 'درآمد ماهانه، پرداخت‌ها و بدهی زبان‌آموزان (بعد از اتصال درگاه پرداخت).' },
    { title: 'ثبت‌نام و ظرفیت کلاس‌ها', text: 'تعداد ثبت‌نام هر دوره، کلاس‌های پر و کلاس‌های کم‌جمعیت.' },
    { title: 'عملکرد اساتید', text: 'حضور، رضایت زبان‌آموزان و تکالیف تصحیح‌شدهٔ هر استاد.' },
    { title: 'تأیید تخفیف و بازگشت وجه', text: 'درخواست‌هایی که فقط مالک باید تأیید کند.' },
    { title: 'گزارش پیامک‌ها', text: 'تعداد و هزینهٔ پیامک‌های ارسالی (بعد از انتخاب سرویس پیامک).' },
  ],
  support: [
    { title: 'تیکت‌های پشتیبانی', text: 'پاسخ به درخواست‌های زبان‌آموزان از یک صندوق مشترک.' },
    { title: 'ثبت‌نام حضوری/تلفنی', text: 'ساخت حساب و ثبت‌نام زبان‌آموز در دوره از طرف پشتیبانی.' },
    { title: 'پیامک گروهی', text: 'اطلاع‌رسانی تغییر ساعت کلاس یا تعطیلی به یک کلاس یا همه.' },
    { title: 'سوابق هر زبان‌آموز', text: 'دوره‌ها، پرداخت‌ها و تیکت‌های یک نفر در یک صفحه.' },
  ],
  supervisor: [
    { title: 'نظارت بر کلاس‌ها', text: 'ورود بی‌صدا به کلاس زنده و ثبت گزارش بازدید.' },
    { title: 'ارزیابی اساتید', text: 'فرم ارزیابی دوره‌ای و دیدن روند هر استاد.' },
    { title: 'گزارش حضور و غیاب', text: 'غیبت‌های پشت‌سرهم زبان‌آموزان و کلاس‌های تشکیل‌نشده.' },
    { title: 'کیفیت تکالیف', text: 'تکالیف تصحیح‌نشده و میانگین نمرهٔ هر کلاس.' },
  ],
}

export default function StaffPanel({ area }: { area: Area }) {
  const role: StaffRole = area
  const base = BASE[area]
  const navigate = useNavigate()
  const [me, setMe] = useState<StaffUser | null>(null)

  useEffect(() => {
    let live = true
    void ensureStaff(role).then((u) => {
      if (!live) return
      if (!u) navigate(`/staff/login/${role}?next=${encodeURIComponent(window.location.pathname)}`, { replace: true })
      else setMe(u)
    })
    return () => { live = false }
  }, [role, navigate])

  const nav: NavItem[] = area === 'supervisor'
    ? [{ to: base, label: 'پیشخوان', icon: Icon.home, end: true }, { to: `${base}/account`, label: 'حساب من', icon: Icon.user }]
    : [
      { to: base, label: 'پیشخوان', icon: Icon.home, end: true },
      { to: `${base}/staff`, label: area === 'owner' ? 'کارکنان' : 'اساتید و پذیرش', short: 'کارکنان', icon: Icon.users },
      { to: `${base}/members`, label: 'زبان‌آموزان', short: 'کاربران', icon: Icon.courses },
      { to: `${base}/account`, label: 'حساب من', icon: Icon.user },
    ]
  const logout = async () => { await logoutStaff(role); navigate(`/staff/login/${role}`, { replace: true }) }

  return (
    <Shell nav={nav} tabs={nav.map((n) => n.to)} user={me ? { name: me.name, role: ROLE_LABEL[role] } : null} profileHref={`${base}/account`}
      appName={APP[area]} notices={[]} noticeKey={`fartash-notices-${area}`} now={null} onLogout={() => void logout()}>
      {!me ? <Skeleton /> : (
        <Routes>
          <Route index element={area === 'supervisor' ? <SupervisorHome me={me} /> : <Home me={me} area={area} />} />
          {area !== 'supervisor' && <Route path="staff" element={<StaffAccounts me={me} />} />}
          {area !== 'supervisor' && <Route path="members" element={<Members />} />}
          <Route path="account" element={<Account me={me} onChange={setMe} />} />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      )}
    </Shell>
  )
}

/* ---------------- overview ---------------- */
function Home({ me, area }: { me: StaffUser; area: Area }) {
  const { data: o, error } = useLoad<Overview>('/api/auth/admin/overview')
  const base = BASE[area]
  const first = me.name.trim().split(/\s+/)[0]
  const staffTotal = o ? Object.values(o.staff).reduce((a, b) => a + b, 0) : undefined
  return (
    <div className="p-page p-dash">
      <h2 className="p-greet">سلام {first}</h2>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="p-stats a-stats">
        <Link to={`${base}/members`} className="p-card p-stat"><small>زبان‌آموزان</small><b>{fmtCount(o?.members.total)}</b><small>{o ? `${fa(o.members.newThisWeek)} نفر در ۷ روز اخیر` : ' '}</small></Link>
        <Link to={`${base}/staff`} className="p-card p-stat"><small>{area === 'owner' ? 'کارکنان فعال' : 'اساتید و پذیرش'}</small>
          <b>{area === 'owner' ? fmtCount(staffTotal) : fmtCount(o ? o.staff.teacher + o.staff.reception : undefined)}</b>
          <small>{o ? `${fa(o.staff.teacher)} استاد • ${fa(o.staff.reception)} پذیرش` : ' '}</small></Link>
        <div className="p-card p-stat"><small>موبایل تأییدشده</small><b>{fmtCount(o?.members.phoneVerified)}</b><small>از {fmtCount(o?.members.total)} حساب</small></div>
        <div className="p-card p-stat"><small>حساب‌های قفل‌شده</small><b>{fmtCount(o ? o.members.locked + o.staffLocked : undefined)}</b><small>پس از ۵ ورود ناموفق، ۱۵ دقیقه</small></div>
      </div>

      <div className="p-row">
        <section className="p-card">
          <header className="p-card-head"><h2>وضعیت ورود</h2></header>
          <ul className="p-list a-checks">
            <li><span className="a-ok" aria-hidden="true">{Icon.check(16)}</span><div><b>ورود با نام کاربری و رمز</b><small>فعال • رمزها هش‌شده ذخیره می‌شوند</small></div></li>
            <li><span className={o?.otpEnabled ? 'a-ok' : 'a-wait'} aria-hidden="true">{o?.otpEnabled ? Icon.check(16) : Icon.clock(16)}</span>
              <div><b>ورود با کد پیامکی</b><small>{o?.otpEnabled ? 'فعال' : 'منتظر انتخاب سرویس پیامک؛ کدش آماده است'}</small></div></li>
            <li><span className="a-ok" aria-hidden="true">{Icon.check(16)}</span><div><b>جداسازی نقش‌ها</b><small>هر نقش فقط پنل خودش را می‌بیند؛ روی سرور بررسی می‌شود</small></div></li>
          </ul>
          {o && <>
            <h3 className="a-sub">کارکنان فعال بر اساس نقش</h3>
            <ul className="a-roles">
              {(area === 'owner' ? (['owner', 'support', 'supervisor', 'reception', 'teacher'] as StaffRole[]) : (['reception', 'teacher'] as StaffRole[])).map((r) => (
                <li key={r}><RoleChip role={r} /><b>{fa(o.staff[r])}</b></li>
              ))}
            </ul>
          </>}
          {area === 'support' && o && <a className="btn btn-ghost btn-block" href={o.contentHubUrl} target="_blank" rel="noopener noreferrer">مدیریت محتوای سایت ↗</a>}
        </section>
        <section className="p-card">
          <header className="p-card-head"><h2>رویدادهای امنیتی و حساب‌ها</h2></header>
          {o?.activity.length ? (
            <ul className="p-list a-activity">
              {o.activity.map((a) => <li key={a.id}><div><b>{a.summary}</b><small>{a.when}</small></div></li>)}
            </ul>
          ) : <p className="p-muted">{o ? 'هنوز رویدادی ثبت نشده است.' : '…'}</p>}
        </section>
      </div>
      <Ideas area={area} />
    </div>
  )
}

function Ideas({ area }: { area: Area }) {
  return (
    <section className="p-card a-ideas">
      <header className="p-card-head"><h2>امکانات پیشنهادی برای این داشبورد</h2><Chip tone="muted">هنوز ساخته نشده</Chip></header>
      <p className="p-muted">این فهرست برای گفت‌وگو با موسسه است. هر کدام را لازم داشتید بگویید تا اضافه شود؛ بقیه حذف می‌شوند.</p>
      <ul className="a-idea-grid">
        {IDEAS[area].map((i) => <li key={i.title}><b>{i.title}</b><small>{i.text}</small></li>)}
      </ul>
    </section>
  )
}

function SupervisorHome({ me }: { me: StaffUser }) {
  return (
    <div className="p-page p-dash">
      <h2 className="p-greet">سلام {me.name.trim().split(/\s+/)[0]}</h2>
      <section className="p-card">
        <Empty icon={Icon.checklist(28)} title="داشبورد سوپروایزر در حال آماده‌سازی است" text="حساب شما فعال است. امکانات این داشبورد بعد از هماهنگی با موسسه اضافه می‌شود." />
      </section>
      <Ideas area="supervisor" />
    </div>
  )
}

/* ---------------- staff accounts ---------------- */
function StaffAccounts({ me }: { me: StaffUser }) {
  const { data, error, reload } = useLoad<{ docs: Row[]; manageableRoles: StaffRole[] }>('/api/auth/admin/staff')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<StaffRole | 'all'>('all')
  useEffect(() => { if (data) setRows(data.docs.map((d) => ({ ...d, kind: 'staff' }))) }, [data])
  const roles = data?.manageableRoles ?? []
  const shown = (rows ?? []).filter((r) => filter === 'all' || r.role === filter)
  const update = (r: Row) => setRows((rs) => rs?.map((x) => (x.id === r.id ? r : x)) ?? null)
  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-tabs" role="group" aria-label="نقش">
          {(['all', ...roles] as const).map((r) => <button key={r} type="button" aria-pressed={filter === r} className={filter === r ? 'on' : ''} onClick={() => setFilter(r)}>{r === 'all' ? 'همه' : ROLE_LABEL[r]}</button>)}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)} disabled={!roles.length}>{Icon.plus(20)} حساب تازه</button>
      </div>
      {me.role === 'support' && <p className="p-muted">پشتیبانی فقط حساب اساتید و پذیرش را می‌سازد و مدیریت می‌کند. حساب مالک، پشتیبانی و سوپروایزر با مالک است.</p>}
      {error && <p className="err" role="alert">{error}</p>}
      <section className="p-card">
        {!rows ? <p className="p-muted">در حال بارگذاری…</p> : shown.length ? (
          <ul className="a-rows">
            {shown.map((r) => (
              <li key={r.id}>
                <div className="a-who">
                  <b>{r.name} {r.id === me.id && <Chip tone="muted">شما</Chip>}</b>
                  <small><bdi dir="ltr">{r.username}</bdi>{r.phone && <> • <bdi dir="ltr">{fa(r.phone)}</bdi></>}</small>
                </div>
                <div className="a-meta">{r.role && <RoleChip role={r.role} />}<StatusChips row={r} /><small>آخرین ورود: {when(r.lastLoginAt)}</small></div>
                <RowActions row={r} roles={roles} self={r.id === me.id} onChanged={update} />
              </li>
            ))}
          </ul>
        ) : <Empty icon={Icon.users(28)} title="حسابی نیست" text="با «حساب تازه» اولین حساب این نقش را بسازید." />}
      </section>
      <Modal open={creating} onClose={() => setCreating(false)} title="ساخت حساب کارمند">
        {creating && roles.length > 0 && <CreateStaff roles={roles} onDone={() => { reload() }} onClose={() => setCreating(false)} />}
      </Modal>
    </div>
  )
}

function CreateStaff({ roles, onDone, onClose }: { roles: StaffRole[]; onDone: () => void; onClose: () => void }) {
  const [f, setF] = useState({ name: '', username: '', role: roles.includes('teacher') ? 'teacher' : roles[0], phone: '', password: suggestPassword() })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState('')
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const r = await api('/api/auth/admin/staff', { ...f, phone: f.phone || undefined })
    setBusy(false)
    if (!r.ok) return setErr(r.message)
    setCreated(f.password); onDone()
  }
  if (created) return (
    <div className="p-form">
      <p className="ok" role="status">حساب «{f.name}» با نام کاربری <bdi dir="ltr">{f.username}</bdi> ساخته شد. آدرس ورود: <bdi dir="ltr">{`/staff/login/${f.role}`}</bdi></p>
      <OneTimeSecret value={created} onDone={onClose} />
    </div>
  )
  return (
    <form className="p-form" onSubmit={onSubmit} noValidate>
      <div className="p-form-grid">
        <label className="p-field"><span>نام و نام خانوادگی</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} required /></label>
        <label className="p-field"><span>نقش</span><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StaffRole })}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
        <label className="p-field"><span>نام کاربری (لاتین)</span><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} dir="ltr" className="ltr-in" autoCapitalize="none" spellCheck={false} maxLength={30} placeholder="arman.kiani" required /></label>
        <label className="p-field"><span>موبایل (اختیاری، برای ورود با کد)</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} dir="ltr" className="ltr-in" inputMode="tel" maxLength={16} placeholder="09121234567" /></label>
      </div>
      <label className="p-field"><span>رمز اولیه</span>
        <span className="a-pw"><input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} dir="ltr" className="ltr-in" maxLength={128} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, password: suggestPassword() })}>رمز تصادفی</button></span>
      </label>
      <p className="p-form-note p-muted">بعد از ساخت، رمز یک بار نمایش داده می‌شود. از کارمند بخواهید بعد از اولین ورود، از «حساب من» رمزش را عوض کند.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="p-btn-row"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'در حال ساخت…' : 'ساخت حساب'}</button><button type="button" className="btn btn-ghost" onClick={onClose}>انصراف</button></div>
    </form>
  )
}

/* ---------------- members ---------------- */
function Members() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const { data, error } = useLoad<{ docs: Row[]; page: number; totalPages: number; totalDocs: number }>(`/api/auth/admin/members?q=${encodeURIComponent(query)}&page=${page}`)
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { if (data) setRows(data.docs.map((d) => ({ ...d, kind: 'member' }))) }, [data])
  const update = (r: Row) => setRows((rs) => rs?.map((x) => (x.id === r.id ? r : x)) ?? null)
  return (
    <div className="p-page">
      <form className="p-toolbar a-search" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q.trim()) }}>
        <label className="p-field"><span className="sr">جست‌وجو</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام، نام کاربری یا موبایل" maxLength={60} /></label>
        <button className="btn btn-primary" type="submit">جست‌وجو</button>
      </form>
      {error && <p className="err" role="alert">{error}</p>}
      <section className="p-card">
        <header className="p-card-head"><h2>زبان‌آموزان و کاربران سایت</h2>{data && <small className="p-muted">{fa(data.totalDocs)} حساب</small>}</header>
        {!rows ? <p className="p-muted">در حال بارگذاری…</p> : rows.length ? (
          <ul className="a-rows">
            {rows.map((r) => (
              <li key={r.id}>
                <div className="a-who"><b>{r.name}</b><small><bdi dir="ltr">{r.username}</bdi>{r.phone && <> • <bdi dir="ltr">{fa(r.phone)}</bdi>{r.phoneVerified && ' ✓'}</>}</small></div>
                <div className="a-meta"><StatusChips row={r} /><small>عضویت: {when(r.createdAt)} • آخرین ورود: {when(r.lastLoginAt)}</small></div>
                <RowActions row={r} roles={[]} onChanged={update} />
              </li>
            ))}
          </ul>
        ) : <Empty icon={Icon.users(28)} title={query ? 'نتیجه‌ای پیدا نشد' : 'هنوز کسی عضو نشده'} text={query ? 'عبارت دیگری را امتحان کنید.' : 'زبان‌آموزان از صفحهٔ «عضویت» سایت ثبت‌نام می‌کنند.'} />}
        {data && data.totalPages > 1 && (
          <div className="p-btn-row a-pages">
            <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</button>
            <span className="p-muted">صفحهٔ {fa(page)} از {fa(data.totalPages)}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>بعدی</button>
          </div>
        )}
      </section>
    </div>
  )
}

/* ---------------- my account ---------------- */
function Account({ me, onChange }: { me: StaffUser; onChange: (u: StaffUser) => void }) {
  const [name, setName] = useState(me.name)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    const r = await authApi.profile('staff', name, me.role)
    if (!r.ok) return setMsg({ ok: false, text: r.message })
    onChange(r.data.user as StaffUser); setMsg({ ok: true, text: 'ذخیره شد.' })
  }
  return (
    <div className="p-page">
      <section className="p-card">
        <header className="p-card-head"><h2>اطلاعات حساب</h2></header>
        <form className="p-form" onSubmit={save} noValidate>
          <div className="p-form-grid">
            <label className="p-field"><span>نام</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
            <label className="p-field"><span>نام کاربری</span><input value={me.username} readOnly dir="ltr" className="ltr-in" /></label>
            <label className="p-field"><span>نقش</span><input value={ROLE_LABEL[me.role]} readOnly /></label>
            <label className="p-field"><span>موبایل</span><input value={me.phone ? fa(me.phone) : '—'} readOnly dir="ltr" className="ltr-in" /></label>
          </div>
          {msg && <p className={msg.ok ? 'ok' : 'err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
          <div className="p-btn-row"><button className="btn btn-primary" type="submit">ذخیره</button></div>
        </form>
      </section>
      <ChangePassword aud="staff" role={me.role} />
    </div>
  )
}
