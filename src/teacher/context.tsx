import { createContext, useContext } from 'react'
import type { Course, Teacher } from '../panel/data'
import type { TeacherSession } from '../panel/session'
import type { Db } from '../school/db'

export type TeacherCtx = {
  session: TeacherSession
  teacher: Teacher
  courses: Course[]
  db: Db
  now: Date
  /** display name of a student (the demo student's name comes from the student session) */
  name: (studentId: string) => string
}
export const TeacherContext = createContext<TeacherCtx | null>(null)
export const useTeacherPanel = () => {
  const c = useContext(TeacherContext)
  if (!c) throw new Error('useTeacherPanel outside the teacher panel')
  return c
}
