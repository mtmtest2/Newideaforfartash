import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { ProfCard } from '../../components/Cards'
import { courseAsProf } from '../../content/adapters'
import type { CourseCardDTO, CourseDTO } from '../../content/types'
import { faNum } from '../../content/format'
import { Gate, Html, Img } from './Gate'

// Only reachable when the offline-courses feature is on: otherwise the server answers these routes with 404,
// exactly like an unknown address, and nothing links here.
export default function Courses() {
  return (
    <Gate<{ items: CourseCardDTO[] }>>{(d) => (
      <PageShell tag="دوره‌های ضبط‌شدهٔ فرتاش" title="دوره‌های آفلاین" text="هر زمان که خواستید، با ویدیوهای ضبط‌شده و تمرین‌های هر درس یاد بگیرید.">
        <div className="prof-grid">{d.items.map(courseAsProf).map((p) => <ProfCard key={p.key} p={p} chip="دورهٔ" href={`/courses/${p.slug}`} />)}</div>
      </PageShell>
    )}</Gate>
  )
}

const hours = (m: number) => (m >= 60 ? `${faNum(Math.round(m / 6) / 10)} ساعت` : `${faNum(m)} دقیقه`)

export function CoursePage() {
  return (
    <Gate<CourseDTO>>{(c) => (
      <PageShell tag="دورهٔ آفلاین" title={c.title} text={c.subtitle ?? c.excerpt} docTitle={c.seo.title}>
        <div className="c-profile">
          <div className="c-profile-photo"><Img img={c.cover} sizes="(max-width: 900px) 90vw, 420px" eager /></div>
          <div className="c-profile-body">
            <dl className="c-facts">
              {c.instructor && <div><dt>مدرس</dt><dd><Link to={`/teachers/${c.instructor.slug}`}>{c.instructor.name}</Link></dd></div>}
              {c.language && <div><dt>زبان</dt><dd><Link to={`/languages/${c.language.slug}`}>{c.language.name}</Link>{c.levels.length > 0 && ` • سطح ${c.levels.join('، ')}`}</dd></div>}
              <div><dt>محتوا</dt><dd>{faNum(c.totalLessons)} درس{c.totalMinutes > 0 && ` • ${hours(c.totalMinutes)}`}</dd></div>
              {c.estimatedWeeks != null && <div><dt>زمان پیشنهادی</dt><dd>{faNum(c.estimatedWeeks)} هفته</dd></div>}
              <div><dt>دسترسی</dt><dd>{c.accessDays ? `${faNum(c.accessDays)} روز` : 'همیشگی'}</dd></div>
            </dl>
            <Html html={c.description} />
            {c.objectives.length > 0 && <><h2>در این دوره یاد می‌گیرید</h2><ul className="c-list">{c.objectives.map((o) => <li key={o}>{o}</li>)}</ul></>}
            {c.audience && <><h2>مناسب برای</h2><p>{c.audience}</p></>}
            {c.prerequisites && <><h2>پیش‌نیازها</h2><p>{c.prerequisites}</p></>}
            {c.promoVideo && <figure className="m-video"><iframe src={c.promoVideo} title={`ویدیوی معرفی ${c.title}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></figure>}
          </div>
        </div>
        {c.modules.length > 0 && (
          <section className="c-related" aria-labelledby="cur-h">
            <h2 id="cur-h">سرفصل‌ها</h2>
            <div className="c-curriculum">
              {c.modules.map((m, mi) => (
                <details key={mi} open={mi === 0}>
                  <summary>{m.title}</summary>
                  {m.description && <p className="c-muted">{m.description}</p>}
                  {m.chapters.map((ch, ci) => (
                    <div key={ci} className="c-chapter">
                      <h3>{ch.title}</h3>
                      <ol>{ch.lessons.map((l) => <li key={l.id}><span>{l.title}</span>{l.preview && <em>پیش‌نمایش رایگان</em>}{l.minutes != null && <small>{faNum(l.minutes)} دقیقه</small>}</li>)}</ol>
                    </div>
                  ))}
                </details>
              ))}
            </div>
          </section>
        )}
      </PageShell>
    )}</Gate>
  )
}
