import PageShell from '../../components/PageShell'
import { PostCard, ProfCard } from '../../components/Cards'
import { toPost, toProf } from '../../content/adapters'
import type { LanguageDTO } from '../../content/types'
import { Gate, Html, Img } from './Gate'

export default function Language() {
  return (
    <Gate<LanguageDTO>>{(l) => (
      <PageShell tag="زبان‌های فرتاش" title={l.name} text={l.intro} docTitle={l.seo.title}>
        <div className="c-article">
          <Img img={l.image} sizes="(max-width: 900px) 100vw, 860px" className="c-cover" eager />
          <Html html={l.description} />
          {l.levels.length > 0 && (
            <section aria-labelledby="lv-h"><h2 id="lv-h">سطح‌های آموزشی</h2>
              <ol className="c-levels">{l.levels.map((x) => <li key={x.code}><b dir="ltr">{x.code}</b><span><strong>{x.title}</strong>{x.description && <small>{x.description}</small>}</span></li>)}</ol>
            </section>
          )}
          {l.exams.length > 0 && (
            <section aria-labelledby="ex-h"><h2 id="ex-h">آمادگی آزمون‌های بین‌المللی</h2>
              <ul className="c-list">{l.exams.map((x) => <li key={x.name}><bdi>{x.name}</bdi>{x.description && ` — ${x.description}`}</li>)}</ul>
            </section>
          )}
          {l.resources.length > 0 && (
            <section aria-labelledby="rs-h"><h2 id="rs-h">منابع یادگیری</h2>
              <ul className="c-list">{l.resources.map((x) => <li key={x.title}>{x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a> : x.title}</li>)}</ul>
            </section>
          )}
        </div>
        {l.teachers.length > 0 && <section className="c-related" aria-labelledby="t-h"><h2 id="t-h">اساتید {l.shortName}</h2>
          <div className="prof-grid">{l.teachers.map(toProf).map((p) => <ProfCard key={p.key} p={p} />)}</div></section>}
        {l.articles.length > 0 && <section className="c-related" aria-labelledby="a-h"><h2 id="a-h">مقاله‌های {l.shortName}</h2>
          <div className="post-grid">{l.articles.map(toPost).map((p) => <PostCard key={p.key} p={p} />)}</div></section>}
      </PageShell>
    )}</Gate>
  )
}
