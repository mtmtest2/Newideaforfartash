// Reception panel (/reception): for now only two jobs — create and moderate the class group chats,
// and oversee every class (list, roster, attendance, join a live class as an observer).
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { courseById, COURSES } from '../panel/data'
import { getReception, getSession, signOutReception, useReception } from '../panel/session'
import Shell, { Skeleton, type NavItem, type NoticeItem } from '../panel/Shell'
import { Icon } from '../panel/ui'
import { DESK, authorName, reader, studentName, unreadIn, useDb } from '../school/db'
import { ReceptionContext, type ReceptionCtx } from './context'

const Home = lazy(() => import('./pages/Home'))
const Classes = lazy(() => import('./pages/Classes'))
const Groups = lazy(() => import('./pages/Groups'))

export default function ReceptionPanel() {
  const session = useReception()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const db = useDb()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    if (!getReception()) { navigate(`/login?role=reception&next=${encodeURIComponent(pathname)}`, { replace: true }); return }
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (now && !session) navigate('/login?role=reception', { replace: true }) }, [session, now, navigate])

  const ctx = useMemo<ReceptionCtx | null>(() => (session && now ? {
    session, db, now, name: (id: string) => studentName(db, id, getSession()?.name),
  } : null), [session, db, now])

  const me = reader('reception', DESK)
  const unread = db.groups.flatMap((g) => unreadIn(db, g.id, me))
  const missing = COURSES.filter((c) => !db.groups.some((g) => g.courseId === c.id)).length

  const nav: NavItem[] = [
    { to: '/reception', label: 'پیشخوان', icon: Icon.dashboard, end: true },
    { to: '/reception/classes', label: 'همهٔ کلاس‌ها', short: 'کلاس‌ها', icon: Icon.users },
    { to: '/reception/groups', label: 'گروه‌های کلاس', short: 'گروه‌ها', icon: Icon.chat, badge: unread.length + missing },
  ]

  const notices = useMemo<NoticeItem[] | null>(() => (ctx ? db.messages.filter((m) => !m.deleted && m.role !== 'reception').map((m) => {
    const g = db.groups.find((x) => x.id === m.groupId)!
    const c = courseById(g.courseId)
    return { id: m.id, kind: 'message' as const, title: `گروه ${c.title} ${c.level}`, text: `${m.role === 'student' ? ctx.name(m.authorId) : authorName(db, m)}: ${m.text}`, date: new Date(m.at), href: `/reception/groups?t=${g.id}` }
  }) : null), [ctx, db])

  const logout = () => { signOutReception(); navigate('/', { replace: true }) }

  return (
    <Shell nav={nav} tabs={nav.map((n) => n.to)} user={session ? { name: session.name, role: 'پذیرش فرتاش' } : null}
      profileHref="/reception" appName="پنل پذیرش فرتاش" notices={notices} noticeKey="fartash-seen-reception" now={now} onLogout={logout}>
      {ctx ? (
        <ReceptionContext.Provider value={ctx}>
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="classes" element={<Classes />} />
              <Route path="groups" element={<Groups />} />
              <Route path="*" element={<Navigate to="/reception" replace />} />
            </Routes>
          </Suspense>
        </ReceptionContext.Provider>
      ) : <Skeleton />}
    </Shell>
  )
}
