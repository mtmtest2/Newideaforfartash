// Screenshots of every reception-panel page (desktop + phone, light + dark). usage: node scripts/reception-shots.cjs <base> <outDir>
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:4173', out = process.argv[3] || 'shots/teacher'
require('fs').mkdirSync(out, { recursive: true })
const pages = ['', 'classes', 'classes?id=en-b1', 'groups?t=g-en-b1']
;(async () => {
  const b = await chromium.launch(); const errs = []
  for (const [tag, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' })
    await ctx.addInitScript((t) => {
      localStorage.setItem('fartash-theme', t)
      localStorage.setItem('fartash-reception', JSON.stringify({ name: 'نرگس امیری', phone: '09121113344', joined: '2025-09-01T00:00:00Z' }))
      localStorage.setItem('fartash-session', JSON.stringify({ name: 'مریم کاظمی', phone: '09121234567', joined: '2026-01-01T00:00:00Z' }))
    }, theme)
    const p = await ctx.newPage()
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    for (const pg of pages) {
      await p.goto(`${base}/reception/${pg}`); await p.waitForSelector('#panel-content .p-page', { timeout: 10000 })
      await p.waitForTimeout(250)
      await p.screenshot({ path: `${out}/${tag}-${theme}-${pg.replace(/[?=~&]/g, '_') || 'home'}.png`, fullPage: tag === 'd' })
    }
    await ctx.close()
  }
  await b.close(); console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no console errors')
})()
