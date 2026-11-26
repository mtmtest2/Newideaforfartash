import { createContext, useContext } from 'react'
import type { Assignment, Demo, Ticket } from './data'
import type { Session } from './session'

export type PanelCtx = {
  session: Session
  demo: Demo
  submitAssignment: (id: string) => void
  addTicket: (t: Pick<Ticket, 'subject' | 'dept' | 'last'>) => void
  markNoticesRead: () => void
  assignments: Assignment[]
  tickets: Ticket[]
}
export const PanelContext = createContext<PanelCtx | null>(null)
export const usePanel = () => {
  const c = useContext(PanelContext)
  if (!c) throw new Error('usePanel outside the panel')
  return c
}
