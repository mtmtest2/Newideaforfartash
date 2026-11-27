import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import { PreviewBar } from './content/PreviewBar'

// Inner pages are split into their own chunks so the home page doesn't download them.
// Prerendered/server-rendered HTML stays on screen while a chunk loads (React keeps server markup inside Suspense).
const Login = lazy(() => import('./pages/Login'))
const StaffLogin = lazy(() => import('./pages/Login').then((m) => ({ default: m.StaffLogin })))
const StaffPanel = lazy(() => import('./staff/StaffPanel'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Placement = lazy(() => import('./pages/Placement'))
const Panel = lazy(() => import('./panel/Panel'))
const TeacherPanel = lazy(() => import('./teacher/Teacher'))
const ReceptionPanel = lazy(() => import('./reception/Reception'))
// CMS-driven pages (Content Hub)
const Magazine = lazy(() => import('./pages/content/Magazine'))
const Article = lazy(() => import('./pages/content/Article'))
const TeacherProfile = lazy(() => import('./pages/content/TeacherProfile'))
const Events = lazy(() => import('./pages/content/Events'))
const EventPage = lazy(() => import('./pages/content/Events').then((m) => ({ default: m.EventPage })))
const Language = lazy(() => import('./pages/content/Language'))
const Courses = lazy(() => import('./pages/content/Courses'))
const CoursePage = lazy(() => import('./pages/content/Courses').then((m) => ({ default: m.CoursePage })))
const CmsPage = lazy(() => import('./pages/content/CmsPage'))
const NotFound = lazy(() => import('./pages/content/Gate').then((m) => ({ default: m.NotFound })))

export default function App() {
  return (
    <Suspense fallback={null}>
      <PreviewBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teachers/:slug" element={<TeacherProfile />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/magazine" element={<Magazine />} />
        <Route path="/magazine/:slug" element={<Article />} />
        <Route path="/blog" element={<Navigate to="/magazine" replace />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventPage />} />
        <Route path="/languages/:slug" element={<Language />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CoursePage />} />
        <Route path="/panel/*" element={<Panel />} />
        <Route path="/teacher/*" element={<TeacherPanel />} />
        <Route path="/reception/*" element={<ReceptionPanel />} />
        <Route path="/owner/*" element={<StaffPanel area="owner" />} />
        <Route path="/support-desk/*" element={<StaffPanel area="support" />} />
        <Route path="/supervisor/*" element={<StaffPanel area="supervisor" />} />
        <Route path="/:slug" element={<CmsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
