import type { HTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bars, Clock, Flag, Star, Users } from './Icons'
import { fa } from '../lib/fa'
import type { Post, Prof } from '../data'

type ArticleProps = HTMLAttributes<HTMLElement> & { inert?: boolean; [k: `data-${string}`]: unknown }

/** Professor card (same layout on the home carousel and the /teachers page). */
export function ProfCard({ p, load = true, className = '', ...rest }: { p: Prof; load?: boolean } & ArticleProps) {
  return (
    <article className={`card prof-card ${className}`} {...rest}>
      <div className="prof-info">
        <span className="lang-chip"><Flag code={p.flag} /> کلاس {p.lang}</span>
        <p className="prof-name"><b>{p.teacher}</b><span>{p.role}</span></p>
        <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        <ul className="meta">
          <li><Users width={18} height={18} /> {fa(p.students)}+ زبان‌آموز</li>
          <li className="rate"><Star width={17} height={17} /> {fa(p.rating).replace('.', '٫')}</li>
          <li><Bars width={17} height={17} className="lvl" /> {p.level}</li>
        </ul>
        <p className="desc">{p.text}</p>
      </div>
      <div className="prof-photo"><img src={load ? p.img : undefined} alt={`${p.teacher}، ${p.role}`} width={p.imgW} height={p.imgH} loading="lazy" decoding="async" /></div>
    </article>
  )
}

export function PostCard({ p, linkable = true, load = true, className = '', ...rest }: { p: Post; linkable?: boolean; load?: boolean } & ArticleProps) {
  return (
    <article className={`card post ${className}`} {...rest}>
      <div className="post-img">
        <img src={load ? p.img : undefined} alt="" width={p.imgW} height={p.imgH} loading="lazy" decoding="async" />
        <span className="pill pill-sm">{p.tag}</span>
      </div>
      <h3>{p.title}</h3>
      <p>{p.text}</p>
      <div className="post-foot">
        <span><Clock width={16} height={16} /> {fa(p.min)} دقیقه مطالعه</span>
        <Link to="/blog" tabIndex={linkable ? 0 : -1}>مطالعهٔ مقاله <ArrowLeft width={15} height={15} /></Link>
      </div>
    </article>
  )
}
