import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'

// Inner pages are split into their own chunks so the home page doesn't download them.
// Prerendered HTML stays on screen while a chunk loads (React keeps server markup inside Suspense).
const Login = lazy(() => import('./pages/Login'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Blog = lazy(() => import('./pages/Blog'))
const Placement = lazy(() => import('./pages/Placement'))
const Panel = lazy(() => import('./panel/Panel'))
const TeacherPanel = lazy(() => import('./teacher/Teacher'))
const ReceptionPanel = lazy(() => import('./reception/Reception'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/panel/*" element={<Panel />} />
        <Route path="/teacher/*" element={<TeacherPanel />} />
        <Route path="/reception/*" element={<ReceptionPanel />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  )
}
