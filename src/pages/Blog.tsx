import PageShell from '../components/PageShell'
import { PostCard } from '../components/Cards'
import { POSTS } from '../data'

export default function Blog() {
  return (
    <PageShell tag="مجلهٔ آموزشی" title="همهٔ مقالات" text="مطالب کاربردی و به‌روز برای یادگیری بهتر زبان.">
      <div className="post-grid">
        {POSTS.map((p, i) => <PostCard key={p.title} p={p} className="rv" style={{ '--d': `${i * 70}ms` } as React.CSSProperties} />)}
      </div>
    </PageShell>
  )
}
