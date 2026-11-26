// Log in through the real form, then screenshot every panel page. usage: node panel-shots.cjs base outDir
const { chromium } = require('playwright')
const [base, out] = process.argv.slice(2)
const PAGES = ['', '/courses', '/schedule', '/assignments', '/recordings', '/certificates', '/payments', '/support', '/profile']
;(async () => {
  const b = await chromium.launch(); const errs = []
  for (const [w, h, tag, theme] of [[1440, 900, 'd', 'light'], [1440, 900, 'd', 'dark'], [390, 844, 'm', 'light'], [390, 844, 'm', 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    const p = await ctx.newPage()
    p.on('pageerror', (e) => errs.push(`${tag}-${theme} ${p.url()} ${e.message}`)); p.on('console', (m) => m.type() === 'error' && errs.push(`${tag}-${theme} ${p.url()} ${m.text().slice(0, 150)}`))
    // real login flow (signup so the name is ours)
    await p.goto(base + '/login/'); await p.waitForTimeout(500)
    await p.click('.seg button:nth-child(2)'); await p.fill('input[name=name]', 'مریم کاظمی'); await p.fill('input[inputmode=tel]', '۰۹۱۲۱۲۳۴۵۶۷')
    await p.click('form button[type=submit]'); await p.fill('input[name=code]', '12345'); await p.click('form button[type=submit]')
    await p.waitForURL('**/panel', { timeout: 5000 }); await p.waitForTimeout(900)
    for (const path of PAGES) {
      await p.goto(base + '/panel' + path); await p.waitForSelector('#panel-content .p-page'); await p.waitForTimeout(900)
      await p.screenshot({ path: `${out}/${tag}-${theme}${path.replace('/', '-') || '-dashboard'}.png`, fullPage: tag === 'd' })
    }
    await ctx.close()
  }
  await b.close()
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console/page errors')
})()
