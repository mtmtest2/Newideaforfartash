import { useSearchParams } from 'react-router-dom'
import Chat, { type Thread } from '../../panel/Chat'
import { courseById } from '../../panel/data'
import { markThreadRead, sendMessage } from '../../school/db'
import { useTeacherPanel } from '../context'

/** Teacher side: one conversation per (course, student). Threads open from the class roster too (?t=course~student). */
export default function Messages() {
  const { db, courses, now, name } = useTeacherPanel()
  const [params] = useSearchParams()
  const ids = courses.map((c) => c.id)
  const keys = new Set(db.messages.filter((m) => ids.includes(m.courseId)).map((m) => `${m.courseId}~${m.studentId}`))
  const asked = params.get('t')
  if (asked && ids.includes(asked.split('~')[0])) keys.add(asked)

  const threads: Thread[] = [...keys].map((key) => {
    const [courseId, studentId] = key.split('~')
    const c = courseById(courseId)
    return {
      key, title: name(studentId), subtitle: `${c.title} ${c.level}`,
      messages: db.messages.filter((m) => m.courseId === courseId && m.studentId === studentId).sort((a, b) => a.at.localeCompare(b.at)),
    }
  })
  const split = (t: Thread) => t.key.split('~') as [string, string]
  return (
    <div className="p-page">
      <Chat threads={threads} me="teacher" now={now} emptyText="هنوز پیامی از زبان‌آموزان ندارید."
        onSend={(t, text) => { const [c, s] = split(t); sendMessage(c, s, 'teacher', text) }}
        onRead={(t) => { const [c, s] = split(t); markThreadRead(c, s, 'teacher') }} />
    </div>
  )
}
