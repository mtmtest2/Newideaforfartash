import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { can } from '../access/permissions'
import { runChecks, type Status } from '../monitoring/checks'
import { Tools } from './Tools'

const LABEL: Record<Status, string> = { operational: 'سالم', degraded: 'کند', warning: 'هشدار', critical: 'بحرانی', unknown: 'نامعلوم', not_configured: 'راه‌اندازی نشده' }

export async function Monitoring({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const allowed = can(req, 'audit.read')
  const checks = allowed ? await runChecks(req.payload) : []
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions}
      searchParams={searchParams} user={req.user || undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="fx-mon">
          <h1>وضعیت سامانه و ابزارهای عیب‌یابی</h1>
          {!allowed ? <p>دسترسی به این بخش را ندارید.</p> : (
            <>
              <p className="fx-muted">هر وضعیت همین حالا بررسی شده است. سرویس‌هایی که هنوز ساخته نشده‌اند «راه‌اندازی نشده» نشان داده می‌شوند، نه «سالم».</p>
              <table className="fx-table">
                <caption className="sr-only">نتیجهٔ بررسی سرویس‌ها</caption>
                <thead><tr><th scope="col">سرویس</th><th scope="col">وضعیت</th><th scope="col">جزئیات</th><th scope="col">راهنما</th></tr></thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.key}>
                      <td>{c.label}</td>
                      <td><span className={`fx-status s-${c.status}`}>{LABEL[c.status]}</span></td>
                      <td dir="auto">{c.detail}</td>
                      <td>{c.hint ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Tools />
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
