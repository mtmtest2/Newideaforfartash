import { COURSES } from '../data'
import { usePanel } from '../context'
import { ME, markThreadRead, sendMessage } from '../../school/db'
import Chat, { type Thread } from '../Chat'

/** Student side: one conversation per course, with that course's teacher. */
export default function Messages() {
  const { db, demo } = usePanel()
  const threads: Thread[] = COURSES.filter((c) => db.rosters[c.id]?.includes(ME)).map((c) => ({
    key: c.id, title: c.teacher, subtitle: `${c.title} ${c.level}`,
    messages: db.messages.filter((m) => m.courseId === c.id && m.studentId === ME).sort((a, b) => a.at.localeCompare(b.at)),
  }))
  return (
    <div className="p-page">
      <Chat threads={threads} me="student" now={demo.now} emptyText="هنوز در دوره‌ای ثبت‌نام نکرده‌اید."
        onSend={(t, text) => sendMessage(t.key, ME, 'student', text)}
        onRead={(t) => markThreadRead(t.key, ME, 'student')} />
    </div>
  )
}
