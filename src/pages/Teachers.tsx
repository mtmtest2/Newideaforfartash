import PageShell from '../components/PageShell'
import { ProfCard } from '../components/Cards'
import { PROFS } from '../data'

export default function Teachers() {
  return (
    <PageShell tag="کلاس‌های آنلاین فرتاش" title="همهٔ اساتید فرتاش" text="با اساتید زبان‌های انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی آشنا شوید.">
      <div className="prof-grid">
        {PROFS.map((p, i) => <ProfCard key={p.lang} p={p} className="rv" style={{ '--d': `${i * 80}ms` } as React.CSSProperties} />)}
      </div>
    </PageShell>
  )
}
