import Chat, { type ChatGroup } from '../../panel/Chat'
import { COURSES, courseById } from '../../panel/data'
import { fa } from '../../lib/fa'
import { DESK, authorName, markGroupRead, reader, canRemove, editMessage, removeMessage, restoreMessage, sendMessage, setGroupLocked, unreadIn } from '../../school/db'
import { useReceptionPanel } from '../context'
import { CreateGroup } from '../parts'

/** Reception: create a group for each class, read every group, post as reception, remove messages, close/reopen. */
export default function Groups() {
  const { db, now, name } = useReceptionPanel()
  const me = reader('reception', DESK)
  const missing = COURSES.filter((c) => !db.groups.some((g) => g.courseId === c.id))
  const groups: ChatGroup[] = db.groups.map((g) => {
    const c = courseById(g.courseId)
    return {
      id: g.id, title: `${c.title} ${c.level}`, subtitle: c.teacher, locked: g.locked,
      members: (db.rosters[c.id]?.length ?? 0) + 2, unread: unreadIn(db, g.id, me).length,
      messages: db.messages.filter((m) => m.groupId === g.id).sort((a, b) => a.at.localeCompare(b.at)),
    }
  })
  return (
    <div className="p-page">
      {missing.length > 0 && (
        <section className="p-card p-missing" aria-labelledby="missing-h">
          <h2 id="missing-h" className="p-section-title">کلاس‌های بدون گروه</h2>
          <ul className="p-list">
            {missing.map((c) => (
              <li key={c.id}>
                <span className={`p-dot c-${c.color}`} aria-hidden="true" />
                <div><b>{c.title} <bdi>{c.level}</bdi></b><small>{c.teacher} • {fa(db.rosters[c.id]?.length ?? 0)} زبان‌آموز؛ استاد و همهٔ زبان‌آموزان عضو گروه می‌شوند.</small></div>
                <CreateGroup c={c} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Chat groups={groups} me={me} now={now} emptyText="هنوز گروهی نساخته‌اید."
        nameOf={(m) => (m.role === 'student' ? name(m.authorId) : authorName(db, m))}
        onSend={(g, text) => sendMessage(g.id, 'reception', DESK, text)}
        onRead={(g) => markGroupRead(g.id, me)}
        onEdit={(m, text) => editMessage(m.id, 'reception', DESK, text)}
        moderate={{
          canRemove: (m) => canRemove(db, m, 'reception', DESK),
          remove: (m) => removeMessage(m.id, 'reception', DESK),
          restore: (m) => restoreMessage(m.id),
          lock: (g, locked) => setGroupLocked(g.id, locked, 'reception', DESK),
        }} />
    </div>
  )
}
