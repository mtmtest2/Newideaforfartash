import { courseById, COURSES } from '../data'
import { usePanel } from '../context'
import { ME, authorName, markGroupRead, reader, sendMessage, unreadIn } from '../../school/db'
import Chat, { type ChatGroup } from '../Chat'

/** Student side: the group chat of each class they are in (groups are created by reception). */
export default function Messages() {
  const { db, demo, session } = usePanel()
  const me = reader('student', ME)
  const mine = COURSES.filter((c) => db.rosters[c.id]?.includes(ME))
  const groups: ChatGroup[] = db.groups.filter((g) => mine.some((c) => c.id === g.courseId)).map((g) => {
    const c = courseById(g.courseId)
    return {
      id: g.id, title: `${c.title} ${c.level}`, subtitle: c.teacher, locked: g.locked,
      members: (db.rosters[c.id]?.length ?? 0) + 2, unread: unreadIn(db, g.id, me).length,
      messages: db.messages.filter((m) => m.groupId === g.id).sort((a, b) => a.at.localeCompare(b.at)),
    }
  })
  const missing = mine.filter((c) => !db.groups.some((g) => g.courseId === c.id))
  return (
    <div className="p-page">
      <Chat groups={groups} me={me} now={demo.now} emptyText="پذیرش هنوز گروه کلاس‌هایتان را نساخته است."
        nameOf={(m) => authorName(db, m, session.name)}
        onSend={(g, text) => sendMessage(g.id, 'student', ME, text)}
        onRead={(g) => markGroupRead(g.id, me)} />
      {missing.length > 0 && <p className="p-muted p-form-note">گروه {missing.map((c) => `«${c.title} ${c.level}»`).join(' و ')} هنوز ساخته نشده است؛ پذیرش آن را می‌سازد.</p>}
    </div>
  )
}
