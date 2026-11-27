import { useIsPreview } from './context'

/** Shown on every page rendered from a dashboard preview link (never on public pages). */
export function PreviewBar() {
  return useIsPreview() ? <p className="preview-bar" role="status">پیش‌نمایش — این نسخه هنوز در سایت منتشر نشده است.</p> : null
}
