import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { PostCard } from '../../components/Cards'
import { toPost } from '../../content/adapters'
import type { ArticleDTO } from '../../content/types'
import { faDate, faNum } from '../../content/format'
import { Gate, Html, Img } from './Gate'

export default function Article() {
  return (
    <Gate<ArticleDTO>>{(a) => (
      <PageShell tag={a.category?.name ?? 'مجلهٔ آموزشی'} title={a.title} text={a.excerpt} docTitle={a.seo.title}>
        <article className="c-article">
          {a.author && (
            <div className="c-byline">
              {a.author.avatar?.src
                ? <Img img={{ ...a.author.avatar, alt: '' }} sizes="64px" className="c-avatar" />
                : <span className="c-avatar c-avatar-empty" aria-hidden="true">{a.author.name.trim().charAt(0)}</span>}
              <span className="c-byline-txt">
                <b>{a.author.name}</b>
                {a.author.role && <small>{a.author.role}</small>}
              </span>
            </div>
          )}
          <p className="c-meta">
            {a.publishedAt && <time dateTime={a.publishedAt}>{faDate(a.publishedAt)}</time>}
            {a.readingTime != null && <span>{faNum(a.readingTime)} دقیقه مطالعه</span>}
            {a.updatedAt && a.publishedAt && a.updatedAt.slice(0, 10) > a.publishedAt.slice(0, 10) && <span>به‌روزرسانی: {faDate(a.updatedAt)}</span>}
          </p>
          <Img img={a.cover} sizes="(max-width: 900px) 100vw, 860px" className="c-cover" eager />
          {a.toc.length > 1 && (
            <nav className="c-toc" aria-label="فهرست مطالب">
              <b>فهرست مطالب</b>
              <ol>{a.toc.map((t) => <li key={t.id} className={`l${t.level}`}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
            </nav>
          )}
          <Html html={a.html} />
          {(a.tags.length > 0 || a.language) && (
            <p className="c-tags">
              {a.language && <Link to={`/languages/${a.language.slug}`}>{a.language.name}</Link>}
              {a.tags.map((t) => <Link key={t.slug} to={`/magazine?tag=${encodeURIComponent(t.slug)}`}>#{t.name}</Link>)}
            </p>
          )}
        </article>
        {a.related.length > 0 && (
          <section className="c-related" aria-labelledby="rel-h">
            <h2 id="rel-h">مقاله‌های مرتبط</h2>
            <div className="post-grid">{a.related.map(toPost).map((p) => <PostCard key={p.key} p={p} />)}</div>
          </section>
        )}
      </PageShell>
    )}</Gate>
  )
}
