import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { PostCard } from '../../components/Cards'
import { toPost } from '../../content/adapters'
import type { ArticleListDTO } from '../../content/types'
import { faNum } from '../../content/format'
import { Gate } from './Gate'

export default function Magazine() {
  const [params] = useSearchParams()
  const cat = params.get('category')
  return (
    <Gate<ArticleListDTO>>{(d) => (
      <PageShell tag="مجلهٔ آموزشی" title={cat ? `مقالات «${d.categories.find((c) => c.slug === cat)?.name ?? cat}»` : 'همهٔ مقالات'} text="مطالب کاربردی و به‌روز برای یادگیری بهتر زبان.">
        {d.categories.length > 1 && (
          <nav className="c-chips" aria-label="دسته‌بندی مقاله‌ها">
            <Link to="/magazine" className={!cat ? 'on' : ''} aria-current={!cat ? 'page' : undefined}>همه</Link>
            {d.categories.map((c) => <Link key={c.slug} to={`/magazine?category=${encodeURIComponent(c.slug)}`} className={cat === c.slug ? 'on' : ''} aria-current={cat === c.slug ? 'page' : undefined}>{c.name}</Link>)}
          </nav>
        )}
        {d.items.length ? (
          <div className="post-grid">
            {d.items.map(toPost).map((p, i) => <PostCard key={p.key} p={p} className="rv" style={{ '--d': `${i * 70}ms` } as React.CSSProperties} />)}
          </div>
        ) : <p className="center c-muted">هنوز مقاله‌ای در این دسته منتشر نشده است.</p>}
        {d.totalPages > 1 && (
          <nav className="c-pages" aria-label="صفحه‌های مقاله‌ها">
            {Array.from({ length: d.totalPages }, (_, i) => i + 1).map((n) => {
              const q = new URLSearchParams(params); if (n === 1) q.delete('page'); else q.set('page', String(n))
              return <Link key={n} to={`/magazine${q.size ? `?${q}` : ''}`} className={n === d.page ? 'on' : ''} aria-current={n === d.page ? 'page' : undefined}>{faNum(n)}</Link>
            })}
          </nav>
        )}
      </PageShell>
    )}</Gate>
  )
}
