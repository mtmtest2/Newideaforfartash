// First-paint check for critical CSS: screenshot each page with the external stylesheet blocked (only inlined
// critical CSS) and with it allowed, JS blocked in both, and report the difference. usage: node critcheck.cjs base outDir
const { chromium } = require('playwright')
const [base, S] = process.argv.slice(2)
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important}'
;(async () => {
  const b = await chromium.launch()
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) for (const theme of ['light', 'dark']) for (const path of ['/', '/teachers/', '/blog/', '/placement/', '/login/']) for (const block of [true, false]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    await ctx.route(/\/assets\/.*\.js$/, (r) => r.abort())
    if (block) await ctx.route(/\/assets\/index-.*\.css$/, (r) => r.abort())
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' })
    await p.evaluate(() => document.fonts.ready); await p.addStyleTag({ content: FREEZE }); await p.waitForTimeout(400)
    await p.screenshot({ path: `${S}/${tag}-${theme}${path.replace(/\//g, '_')}${block ? '-crit' : '-full'}.png` }); await ctx.close()
  }
  await b.close()
})()
