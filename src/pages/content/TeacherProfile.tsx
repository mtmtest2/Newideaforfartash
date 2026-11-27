import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { Flag } from '../../components/Icons'
import type { FlagCode } from '../../data'
import type { TeacherDTO } from '../../content/types'
import { faNum } from '../../content/format'
import { Gate, Html, Img } from './Gate'

export default function TeacherProfile() {
  return (
    <Gate<TeacherDTO>>{(t) => (
      <PageShell tag="اساتید فرتاش" title={t.name} text={t.title} docTitle={t.seo.title}>
        <div className="c-profile">
          <div className="c-profile-photo"><Img img={t.photo} sizes="(max-width: 900px) 90vw, 420px" eager /></div>
          <div className="c-profile-body">
            <p className="c-chips-static">
              {t.languages.map((l) => <Link key={l.slug} to={`/languages/${l.slug}`} className="lang-chip"><Flag code={l.flag as FlagCode} /> {l.name}</Link>)}
              {t.levels.length > 0 && <span className="c-pill">سطح {t.levels.join('، ')}</span>}
              {t.experienceYears != null && <span className="c-pill">{faNum(t.experienceYears)} سال سابقهٔ تدریس</span>}
            </p>
            <Html html={t.bio} />
            {t.specializations.length > 0 && <><h2>تخصص‌ها</h2><ul className="c-list">{t.specializations.map((s) => <li key={s}>{s}</li>)}</ul></>}
            {t.qualifications.length > 0 && <><h2>مدارک تحصیلی</h2><ul className="c-list">{t.qualifications.map((s) => <li key={s}>{s}</li>)}</ul></>}
            {t.certificates.length > 0 && <><h2>گواهی‌ها</h2><ul className="c-list">{t.certificates.map((c) => <li key={c.label}>{c.label}{c.year ? ` (${faNum(c.year)})` : ''}</li>)}</ul></>}
            {t.introVideo && <figure className="m-video"><iframe src={t.introVideo} title={`ویدیوی معرفی ${t.name}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></figure>}
            <p><Link to="/placement" className="btn btn-primary">تعیین سطح رایگان</Link></p>
          </div>
        </div>
      </PageShell>
    )}</Gate>
  )
}
