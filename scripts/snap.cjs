// Visual-regression snapshots: every page × {desktop, mobile} × {light, dark}, animations frozen,
// timers frozen (carousels stay on slide 1), every reveal triggered. usage: node scripts/snap.cjs <baseUrl> <outDir>
const { chromium } = require('playwright')
const fs = require('fs')
const [base, out] = process.argv.slice(2)
const PAGES = ['/', '/teachers', '/blog', '/placement', '/login']
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} .rv{opacity:1!important;transform:none!important} video{visibility:hidden!important}'
;(async () => {
  fs.mkdirSync(out, { recursive: true })
  const b = await chromium.launch()
  for (const [vw, vh, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' })
    await ctx.addInitScript((t) => { try { localStorage.setItem('fartash-theme', t) } catch {} }, theme)
    const p = await ctx.newPage()
    await p.clock.install({ time: new Date('2026-11-23T10:00:00Z') })
    for (const path of PAGES) {
      await p.goto(base + path, { waitUntil: 'networkidle' })
      await p.addStyleTag({ content: FREEZE })
      // the fake clock also fakes requestAnimationFrame, so pace the scroll from the test side
      const h = await p.evaluate(() => document.body.scrollHeight)
      for (let y = 0; y < h; y += 400) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60) }
      await p.evaluate(() => window.scrollTo(0, 0))
      await p.waitForLoadState('networkidle')
      await p.waitForTimeout(300)
      const name = `${tag}-${theme}${path.replace(/\//g, '_') || '_'}.png`
      await p.screenshot({ path: `${out}/${name}`, fullPage: true })
    }
    await ctx.close()
  }
  await b.close()
  console.log('snapshots:', fs.readdirSync(out).length)
})()
