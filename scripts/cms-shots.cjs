// Screenshots of the Support Dashboard and the Content Hub pages (light + dark).
// usage: node scripts/cms-shots.cjs <outDir> [cmsUrl] [webUrl]   (needs a support account: SUPPORT_EMAIL / SUPPORT_PASSWORD)
const { chromium } = require('playwright')
const fs = require('fs')
const [out = 'shots/cms', CMS = 'http://localhost:3001', WEB = 'http://localhost:4173'] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const EMAIL = process.env.SUPPORT_EMAIL || 'support@fartash.example', PASS = process.env.SUPPORT_PASSWORD || 'DevOnly-Pass-2026'
const ADMIN = (process.env.ADMIN_PAGES || 'dashboard:/support,articles:/support/collections/articles,article:/support/collections/articles/1,teachers:/support/collections/teachers,courses:/support/collections/courses,flags:/support/globals/feature-flags,home:/support/globals/home-layout,monitoring:/support/monitoring,audit:/support/collections/audit-logs,media:/support/collections/media').split(',').map((x) => x.split(/:(.+)/))
const SITE = (process.env.SITE_PAGES || 'magazine:/magazine,article:/magazine/english-speaking-skills,teacher:/teachers/arman-kiani,language:/languages/english,events:/events,event:/events/speaking-confidence-workshop,about:/about,404:/no-such-page').split(',').map((x) => x.split(/:(.+)/))
;(async () => {
  const b = await chromium.launch()
  const snap = async (p, f) => { const cdp = await p.context().newCDPSession(p); const s = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(f, Buffer.from(s.data, 'base64')) }
  for (const theme of ['light', 'dark']) {
    if (process.env.SKIP_ADMIN !== '1') {
      const ctx = await b.newContext({ viewport: { width: Number(process.env.ADMIN_W || 1600), height: 1000 } })
      await ctx.addCookies([{ name: 'payload-theme', value: theme, url: CMS }])
      const p = await ctx.newPage()
      await p.goto(`${CMS}/support/login`); await p.waitForSelector('input[name=email]', { timeout: 120000 })
      await snap(p, `${out}/adm-${theme}-login.png`)
      await p.fill('input[name=email]', EMAIL); await p.fill('input[name=password]', PASS); await p.click('button[type=submit]')
      await p.waitForURL(/\/support\/?$/, { timeout: 120000 })
      for (const [name, url] of ADMIN) {
        await p.goto(CMS + url, { waitUntil: 'networkidle', timeout: 180000 }).catch(() => {})
        await p.waitForTimeout(2500)
        await snap(p, `${out}/adm-${theme}-${name}.png`)
      }
      await ctx.close()
    }
    if (process.env.SKIP_SITE !== '1') for (const [tag, vp] of [['d', { width: 1440, height: 950 }], ['m', { width: 390, height: 844 }]]) {
      const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' })
      await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
      const p = await ctx.newPage()
      for (const [name, url] of SITE) {
        await p.goto(WEB + url, { waitUntil: 'networkidle' }).catch(() => {})
        await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' })
        await p.waitForTimeout(400)
        await p.screenshot({ path: `${out}/site-${tag}-${theme}-${name}.png`, fullPage: true })
      }
      await ctx.close()
    }
  }
  await b.close(); console.log('done')
})()
