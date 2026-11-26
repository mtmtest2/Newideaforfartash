import { createContext, useContext } from 'react'
import type { ReceptionSession } from '../panel/session'
import type { Db } from '../school/db'

export type ReceptionCtx = {
  session: ReceptionSession
  db: Db
  now: Date
  /** display name of a student (the demo student's name comes from the student session) */
  name: (studentId: string) => string
}
export const ReceptionContext = createContext<ReceptionCtx | null>(null)
export const useReceptionPanel = () => {
  const c = useContext(ReceptionContext)
  if (!c) throw new Error('useReceptionPanel outside the reception panel')
  return c
}
