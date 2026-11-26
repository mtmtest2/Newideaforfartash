import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ME, avgScore, studentName, submitTask, useDb } from '../school/db'
import { buildDemo, courseById, COURSES, type Assignment, type Demo, type Ticket } from './data'
import { PanelContext, type PanelCtx } from './context'
import { getSession, signOut, useSession } from './session'
import Shell, { Skeleton, type NavItem, type NoticeItem } from './Shell'
import { Icon } from './ui'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Courses = lazy(() => import('./pages/Courses'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Messages = lazy(() => import('./pages/Messages'))
const Recordings = lazy(() => import('./pages/Recordings'))
const Certificates = lazy(() => import('./pages/Certificates'))
const Payments = lazy(() => import('./pages/Payments'))
const Support = lazy(() => import('./pages/Support'))
const Profile = lazy(() => import('./pages/Profile'))

const TABS = ['/panel', '/panel/courses', '/panel/schedule', '/panel/assignments']

export default function Panel() {
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const db = useDb()

  // Client only: data depends on "now" and the session lives in localStorage.
  useEffect(() => {
    if (!getSession()) {
      navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true })
      return
    }
    const d = buildDemo()
    setDemo(d); setTickets(d.tickets)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (demo && !session) navigate('/login', { replace: true }) }, [session, demo, navigate])

  // the student's view of the shared school data: tasks of their courses + their own submissions
  const assignments = useMemo<Assignment[]>(() => {
    const mine = COURSES.filter((c) => db.rosters[c.id]?.includes(ME)).map((c) => c.id)
    return db.tasks.filter((t) => mine.includes(t.courseId)).map((t) => {
      const s = db.submissions.find((x) => x.taskId === t.id && x.studentId === ME)
      return {
        id: t.id, course: courseById(t.courseId), title: t.title, kind: t.kind, desc: t.desc, due: new Date(t.due), max: t.max,
        status: !s ? 'pending' : s.score != null ? 'graded' : 'submitted',
        score: s?.score, feedback: s?.feedback, answer: s?.answer, file: s?.file, submittedAt: s ? new Date(s.at) : undefined,
      }
    })
  }, [db])

  const ctx = useMemo<PanelCtx | null>(() => (session && demo ? {
    session, demo, assignments, tickets, db,
    avgScore: avgScore(db.submissions.filter((s) => s.studentId === ME), db.tasks),
    submitAssignment: (id, answer, file) => submitTask(id, ME, answer, file),
    addTicket: (t) => setTickets((ts) => [{ ...t, id: `T-${1040 + ts.length}`, date: new Date(), status: 'open' }, ...ts]),
  } : null), [session, demo, assignments, tickets, db])

  const pending = assignments.filter((a) => a.status === 'pending' && a.due > (demo?.now ?? new Date(0))).length
  const unreadMsgs = db.messages.filter((m) => m.studentId === ME && m.from === 'teacher' && !m.read).length

  const nav: NavItem[] = [
    { to: '/panel', label: 'داشبورد', icon: Icon.dashboard, end: true },
    { to: '/panel/courses', label: 'دوره‌های من', short: 'دوره‌ها', icon: Icon.courses },
    { to: '/panel/schedule', label: 'برنامهٔ کلاس‌ها', short: 'برنامه', icon: Icon.calendar },
    { to: '/panel/assignments', label: 'تکالیف و آزمون‌ها', short: 'تکالیف', icon: Icon.tasks, badge: pending },
    { to: '/panel/messages', label: 'پیام به استاد', short: 'پیام‌ها', icon: Icon.chat, badge: unreadMsgs },
    { to: '/panel/recordings', label: 'جلسات ضبط‌شده', icon: Icon.video },
    { to: '/panel/certificates', label: 'گواهی‌ها', icon: Icon.award },
    { to: '/panel/payments', label: 'پرداخت‌ها', icon: Icon.wallet },
    { to: '/panel/support', label: 'پشتیبانی', icon: Icon.support },
    { to: '/panel/profile', label: 'پروفایل و تنظیمات', icon: Icon.user },
  ]

  const notices = useMemo<NoticeItem[] | null>(() => {
    if (!demo) return null
    const mine = COURSES.filter((c) => db.rosters[c.id]?.includes(ME)).map((c) => c.id)
    return [
      ...demo.notices.map((n) => ({ ...n, href: n.kind === 'payment' ? '/panel/payments' : undefined })),
      ...db.announcements.filter((a) => mine.includes(a.courseId)).map((a) => ({
        id: a.id, kind: 'class' as const, title: a.title, text: `${courseById(a.courseId).teacher}: ${a.text}`, date: new Date(a.at), href: '/panel' })),
      ...db.submissions.filter((s) => s.studentId === ME && s.gradedAt).map((s) => {
        const t = db.tasks.find((x) => x.id === s.taskId)
        return { id: 'g' + s.id, kind: 'assignment' as const, title: 'نمرهٔ تازه ثبت شد', text: `«${t?.title}»`, date: new Date(s.gradedAt!), href: '/panel/assignments?status=graded' }
      }),
      ...db.messages.filter((m) => m.studentId === ME && m.from === 'teacher').map((m) => ({
        id: m.id, kind: 'message' as const, title: `پیام ${courseById(m.courseId).teacher}`, text: m.text, date: new Date(m.at), href: `/panel/messages?t=${m.courseId}` })),
    ]
  }, [demo, db])

  const logout = () => { signOut(); navigate('/', { replace: true }) }

  return (
    <Shell nav={nav} tabs={TABS} user={session ? { name: studentName(db, ME, session.name), role: 'زبان‌آموز' } : null}
      profileHref="/panel/profile" appName="پنل فرتاش" notices={notices} noticeKey="fartash-seen-student" now={demo?.now ?? null} onLogout={logout}>
      {ctx ? (
        <PanelContext.Provider value={ctx}>
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="messages" element={<Messages />} />
              <Route path="recordings" element={<Recordings />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="payments" element={<Payments />} />
              <Route path="support" element={<Support />} />
              <Route path="profile" element={<Profile onLogout={logout} />} />
              <Route path="*" element={<Navigate to="/panel" replace />} />
            </Routes>
          </Suspense>
        </PanelContext.Provider>
      ) : <Skeleton />}
    </Shell>
  )
}
