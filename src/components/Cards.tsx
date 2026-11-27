import type { HTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bars, Clock, Flag, Star, Users } from './Icons'
import { fa } from '../lib/fa'
import type { CardPost, CardProf } from '../content/adapters'

type ArticleProps = HTMLAttributes<HTMLElement> & { inert?: boolean; [k: `data-${string}`]: unknown }

/** Professor card (same layout on the home carousel and the /teachers page). */
export function ProfCard({ p, load = true, href, chip = 'کلاس', className = '', ...rest }: { p: CardProf; load?: boolean; href?: string; chip?: string } & ArticleProps) {
  const link = href ?? (p.slug ? `/teachers/${p.slug}` : undefined)
  return (
    <article className={`card prof-card ${className}`} {...rest}>
      <div className="prof-info">
        <span className="lang-chip"><Flag code={p.flag} /> {chip} {p.lang}</span>
        <p className="prof-name"><b>{link ? <Link to={link} className="card-link">{p.teacher}</Link> : p.teacher}</b><span>{p.role}</span></p>
        <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        <ul className="meta">
          {p.students != null && <li><Users width={18} height={18} /> {fa(p.students)}+ زبان‌آموز</li>}
          {p.rating != null && <li className="rate"><Star width={17} height={17} /> {fa(p.rating).replace('.', '٫')}</li>}
          <li><Bars width={17} height={17} className="lvl" /> {p.level}</li>
        </ul>
        <p className="desc">{p.text}</p>
      </div>
      <div className="prof-photo"><img src={load ? p.img : undefined} srcSet={load && p.srcSet ? p.srcSet : undefined} sizes="(max-width: 900px) 90vw, 460px" alt={`${p.teacher}، ${p.role}`} width={p.imgW} height={p.imgH} loading="lazy" decoding="async" /></div>
    </article>
  )
}

export function PostCard({ p, linkable = true, load = true, className = '', ...rest }: { p: CardPost; linkable?: boolean; load?: boolean } & ArticleProps) {
  return (
    <article className={`card post ${className}`} {...rest}>
      <div className="post-img">
        <img src={load ? p.img : undefined} srcSet={load && p.srcSet ? p.srcSet : undefined} sizes="(max-width: 900px) 90vw, 420px" alt="" width={p.imgW} height={p.imgH} loading="lazy" decoding="async" />
        <span className="pill pill-sm">{p.tag}</span>
      </div>
      <h3>{p.title}</h3>
      <p>{p.text}</p>
      <div className="post-foot">
        {p.min != null ? <span><Clock width={16} height={16} /> {fa(p.min)} دقیقه مطالعه</span> : <span />}
        <Link to={p.slug ? `/magazine/${p.slug}` : '/magazine'} tabIndex={linkable ? 0 : -1}>مطالعهٔ مقاله <ArrowLeft width={15} height={15} /></Link>
      </div>
    </article>
  )
}
