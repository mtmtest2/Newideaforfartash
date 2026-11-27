import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { useSite } from '../../content/context'
import type { PageDTO } from '../../content/types'
import { Gate, Html, Img } from './Gate'

/** Pages edited in the Support Dashboard with predefined blocks only (no free layout). */
export default function CmsPage() {
  const site = useSite()
  return (
    <Gate<PageDTO>>{(p) => {
      const intro = p.blocks[0]?.type === 'intro' ? p.blocks[0] : null
      return (
        <PageShell tag={site.settings.name} title={intro?.heading ?? p.title} text={intro?.text ?? undefined} docTitle={p.seo.title}>
          <div className="c-article">
            {p.blocks.map((b, i) => {
              switch (b.type) {
                case 'intro': return i === 0 ? <Img key={i} img={b.image} sizes="(max-width: 900px) 100vw, 860px" className="c-cover" eager /> : <section key={i}><h2>{b.heading}</h2>{b.text && <p>{b.text}</p>}<Img img={b.image} sizes="(max-width: 900px) 100vw, 860px" className="c-cover" /></section>
                case 'richText': return <Html key={i} html={b.html} />
                case 'faq': return (
                  <section key={i} className="c-faq">{b.title && <h2>{b.title}</h2>}
                    {b.items.map((it) => <details key={it.q}><summary>{it.q}</summary><p>{it.a}</p></details>)}
                  </section>)
                case 'cta': return (
                  <div key={i} className="cta c-cta"><h2>{b.heading}</h2>{b.text && <p>{b.text}</p>}
                    {b.href.startsWith('/') ? <Link to={b.href} className="btn btn-primary btn-lg">{b.buttonLabel}</Link> : <a href={b.href} className="btn btn-primary btn-lg" rel="noopener noreferrer">{b.buttonLabel}</a>}
                  </div>)
                case 'contact': return (
                  <section key={i} className="c-contact">{b.title && <h2>{b.title}</h2>}
                    <address>
                      {site.settings.contact.address && <p>{site.settings.contact.address}</p>}
                      {site.settings.contact.phone && <p><a href={`tel:${site.settings.contact.phone}`}><bdi dir="ltr">{site.settings.contact.phoneDisplay ?? site.settings.contact.phone}</bdi></a></p>}
                      {site.settings.contact.email && <p><a href={`mailto:${site.settings.contact.email}`}>{site.settings.contact.email}</a></p>}
                      {site.settings.contact.hours && <p>{site.settings.contact.hours}</p>}
                    </address>
                  </section>)
                case 'announcement': return <p key={i} className={`c-note t-${b.tone}`} role="note">{b.text}</p>
                default: return null
              }
            })}
          </div>
        </PageShell>
      )
    }}</Gate>
  )
}
