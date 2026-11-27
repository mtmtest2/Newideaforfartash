import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { useIsPreview, useRouteData } from '../../content/context'

/** Loading / not-found / error states shared by every CMS-driven page. */
export function Gate<T>({ children }: { children: (data: T) => ReactNode }) {
  const r = useRouteData<T>()
  const preview = useIsPreview()
  if (r.status === 'ready') return <>{preview && <p className="preview-bar" role="status">پیش‌نمایش پیش‌نویس — این نسخه هنوز منتشر نشده است.</p>}{children(r.data)}</>
  if (r.status === 'loading') return <PageShell tag="فرتاش" title="در حال بارگذاری…"><div className="c-skel" aria-busy="true"><div /><div /><div /></div></PageShell>
  if (r.status === 'error') return <PageShell tag="خطا" title="صفحه بارگذاری نشد" text="ارتباط با سرور برقرار نشد. چند لحظهٔ دیگر دوباره امتحان کنید."><p className="center"><button type="button" className="btn btn-dark" onClick={() => location.reload()}>تلاش دوباره</button></p></PageShell>
  return <NotFound />
}

export function NotFound() {
  return (
    <PageShell tag="۴۰۴" title="این صفحه پیدا نشد" text="ممکن است نشانی را اشتباه وارد کرده باشید یا صفحه برداشته شده باشد.">
      <p className="center" data-not-found=""><Link to="/" className="btn btn-dark">بازگشت به صفحهٔ اصلی</Link></p>
    </PageShell>
  )
}

/** Trusted HTML produced by the CMS (escaped and sanitized server-side in cms/src/public-api/html.ts). */
export const Html = ({ html, className = 'c-prose' }: { html: string; className?: string }) =>
  html ? <div className={className} dangerouslySetInnerHTML={{ __html: html }} /> : null

export const Img = ({ img, sizes, className, eager }: { img: { src: string | null; width: number | null; height: number | null; alt: string; srcSet: string | null } | null; sizes: string; className?: string; eager?: boolean }) =>
  img?.src ? <img className={className} src={img.src} srcSet={img.srcSet ?? undefined} sizes={sizes} width={img.width ?? undefined} height={img.height ?? undefined} alt={img.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} /> : null
