import { createContext, useContext } from 'react'
import type { Db } from '../school/db'
import type { Assignment, Demo, Ticket } from './data'
import type { Session } from './session'

export type PanelCtx = {
  session: Session
  demo: Demo
  db: Db
  /** the student's tasks with their own submission status, from the shared school db */
  assignments: Assignment[]
  avgScore: number | null
  submitAssignment: (id: string, answer: string, file?: string) => void
  addTicket: (t: Pick<Ticket, 'subject' | 'dept' | 'last'>) => void
  tickets: Ticket[]
}
export const PanelContext = createContext<PanelCtx | null>(null)
export const usePanel = () => {
  const c = useContext(PanelContext)
  if (!c) throw new Error('usePanel outside the panel')
  return c
}
