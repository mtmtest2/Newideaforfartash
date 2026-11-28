import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { courseById, TEACHERS } from '../panel/data'
import { getSession, useTeacher } from '../panel/session'
import { ensureStaff, logoutStaff } from '../auth/client'
import Shell, { Skeleton, type NavItem, type NoticeItem } from '../panel/Shell'
import { Icon } from '../panel/ui'
import { authorName, coursesOfTeacher, reader, studentName, unreadIn, useDb } from '../school/db'
import { TeacherContext, type TeacherCtx } from './context'

const Home = lazy(() => import('./pages/Home'))
const Classes = lazy(() => import('./pages/Classes'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Messages = lazy(() => import('./pages/Messages'))
const Profile = lazy(() => import('./pages/Profile'))

const TABS = ['/teacher', '/teacher/classes', '/teacher/assignments', '/teacher/messages']

export default function TeacherPanel() {
  const session = useTeacher()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const db = useDb()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let live = true, id = 0
    void ensureStaff('teacher').then((u) => {
      if (!live) return
      if (!u) { navigate(`/staff/login/teacher?next=${encodeURIComponent(pathname)}`, { replace: true }); return }
      setNow(new Date())
      id = window.setInterval(() => setNow(new Date()), 60000)
    })
    return () => { live = false; window.clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (now && !session) navigate('/staff/login/teacher', { replace: true }) }, [session, now, navigate])

  const teacher = TEACHERS.find((t) => t.id === session?.teacherId) ?? TEACHERS[0]
  const courses = useMemo(() => coursesOfTeacher(teacher.id), [teacher.id])
  const ids = courses.map((c) => c.id)

  const ctx = useMemo<TeacherCtx | null>(() => (session && now ? {
    session, teacher, courses, db, now,
    name: (id: string) => studentName(db, id, getSession()?.name),
  } : null), [session, teacher, courses, db, now])

  const myTasks = db.tasks.filter((t) => ids.includes(t.courseId))
  const toGrade = db.submissions.filter((s) => s.score == null && myTasks.some((t) => t.id === s.taskId))
  const myGroups = db.groups.filter((g) => ids.includes(g.courseId))
  const unread = myGroups.flatMap((g) => unreadIn(db, g.id, reader('teacher', teacher.id)))

  const nav: NavItem[] = [
    { to: '/teacher', label: 'پیشخوان', icon: Icon.dashboard, end: true },
    { to: '/teacher/classes', label: 'کلاس‌های من', short: 'کلاس‌ها', icon: Icon.users },
    { to: '/teacher/schedule', label: 'برنامهٔ تدریس', icon: Icon.calendar },
    { to: '/teacher/assignments', label: 'تکالیف و نمره‌دهی', short: 'نمره‌دهی', icon: Icon.tasks, badge: toGrade.length },
    { to: '/teacher/attendance', label: 'حضور و غیاب', icon: Icon.checklist },
    { to: '/teacher/messages', label: 'گروه‌های کلاس', short: 'گروه‌ها', icon: Icon.chat, badge: unread.length },
    { to: '/teacher/profile', label: 'پروفایل و تنظیمات', icon: Icon.user },
  ]

  const notices = useMemo<NoticeItem[] | null>(() => (ctx ? [
    ...toGrade.map((s) => {
      const t = myTasks.find((x) => x.id === s.taskId)!
      return { id: 'sub' + s.id, kind: 'assignment' as const, title: 'پاسخ تازه برای نمره‌دهی', text: `${ctx.name(s.studentId)}: «${t.title}»`, date: new Date(s.at), href: `/teacher/assignments?task=${t.id}&sub=${s.id}` }
    }),
    ...db.messages.filter((m) => !m.deleted && m.role !== 'teacher' && myGroups.some((g) => g.id === m.groupId)).map((m) => {
      const c = courseById(myGroups.find((g) => g.id === m.groupId)!.courseId)
      return { id: m.id, kind: 'message' as const, title: `گروه ${c.title} ${c.level}`, text: `${m.role === 'student' ? ctx.name(m.authorId) : authorName(db, m)}: ${m.text}`, date: new Date(m.at), href: `/teacher/messages?t=${m.groupId}` }
    }),
  ] : null), [ctx, db]) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => { void logoutStaff('teacher').then(() => navigate('/staff/login/teacher', { replace: true })) }

  return (
    <Shell nav={nav} tabs={TABS} user={session ? { name: `استاد ${session.name}`, role: teacher.title } : null}
      profileHref="/teacher/profile" appName="پنل استاد فرتاش" notices={notices} noticeKey="fartash-seen-teacher" now={now} onLogout={logout}>
      {ctx ? (
        <TeacherContext.Provider value={ctx}>
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="classes" element={<Classes />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="assignments" element={<Tasks />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="messages" element={<Messages />} />
              <Route path="profile" element={<Profile onLogout={logout} />} />
              <Route path="*" element={<Navigate to="/teacher" replace />} />
            </Routes>
          </Suspense>
        </TeacherContext.Provider>
      ) : <Skeleton />}
    </Shell>
  )
}

