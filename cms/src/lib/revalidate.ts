// Tells the public site to drop cached pages after content changes. Fire-and-forget with a short timeout;
// failures are logged (System Monitoring shows the last result) and the site also expires its cache on its own.
// kept on globalThis: Next.js loads this module separately for API routes and admin pages in one process
const g = globalThis as unknown as { __fartashRevalidation?: { at?: string; ok?: boolean; error?: string } }
export const lastRevalidation = (g.__fartashRevalidation ??= {})

export async function revalidateSite(tags: string[]) {
  const url = process.env.SITE_REVALIDATE_URL
  if (!url) return
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.CONTENT_API_SECRET ?? ''}` },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(4000),
    })
    Object.assign(lastRevalidation, { at: new Date().toISOString(), ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` })
  } catch (e) {
    Object.assign(lastRevalidation, { at: new Date().toISOString(), ok: false, error: (e as Error).message })
  }
}
