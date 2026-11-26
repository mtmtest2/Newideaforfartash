import Chat, { type ChatGroup } from '../../panel/Chat'
import { courseById } from '../../panel/data'
import { authorName, markGroupRead, reader, sendMessage, unreadIn } from '../../school/db'
import { useTeacherPanel } from '../context'

/** Teacher side: the group chat of each of their classes (groups are created by reception). */
export default function Messages() {
  const { db, courses, now, teacher, name } = useTeacherPanel()
  const me = reader('teacher', teacher.id)
  const groups: ChatGroup[] = db.groups.filter((g) => courses.some((c) => c.id === g.courseId)).map((g) => {
    const c = courseById(g.courseId)
    return {
      id: g.id, title: `${c.title} ${c.level}`, subtitle: c.type === 'live' ? 'کلاس زنده' : 'دورهٔ آفلاین', locked: g.locked,
      members: (db.rosters[c.id]?.length ?? 0) + 2, unread: unreadIn(db, g.id, me).length,
      messages: db.messages.filter((m) => m.groupId === g.id).sort((a, b) => a.at.localeCompare(b.at)),
    }
  })
  const missing = courses.filter((c) => !db.groups.some((g) => g.courseId === c.id))
  return (
    <div className="p-page">
      <Chat groups={groups} me={me} now={now} emptyText="پذیرش هنوز گروه کلاس‌هایتان را نساخته است."
        nameOf={(m) => (m.role === 'student' ? name(m.authorId) : authorName(db, m))}
        onSend={(g, text) => sendMessage(g.id, 'teacher', teacher.id, text)}
        onRead={(g) => markGroupRead(g.id, me)} />
      {missing.length > 0 && <p className="p-muted p-form-note">گروه {missing.map((c) => `«${c.title} ${c.level}»`).join(' و ')} هنوز ساخته نشده است؛ پذیرش آن را می‌سازد.</p>}
    </div>
  )
}
