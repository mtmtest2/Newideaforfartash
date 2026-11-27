import PageShell from '../components/PageShell'
import { ProfCard } from '../components/Cards'
import { toProf } from '../content/adapters'
import type { TeacherCardDTO } from '../content/types'
import { Gate } from './content/Gate'

export default function Teachers() {
  return (
    <Gate<{ items: TeacherCardDTO[] }>>{(d) => (
      <PageShell tag="کلاس‌های آنلاین فرتاش" title="همهٔ اساتید فرتاش" text="با اساتید زبان‌های انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی آشنا شوید.">
        <div className="prof-grid">
          {d.items.map(toProf).map((p, i) => <ProfCard key={p.key} p={p} className="rv" style={{ '--d': `${i * 80}ms` } as React.CSSProperties} />)}
        </div>
      </PageShell>
    )}</Gate>
  )
}
