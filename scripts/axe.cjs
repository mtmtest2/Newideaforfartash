// axe-core (WCAG 2 A/AA) on every page, both themes, desktop + phone, with scroll-reveal content forced visible
// so nothing is skipped as hidden. usage: node scripts/axe.cjs http://localhost:8088
const { chromium } = require('playwright')
const fs = require('fs')
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const base = process.argv[2] || 'http://localhost:8088'
;(async () => {
  const b = await chromium.launch(); let total = 0
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) for (const path of ['/', '/teachers', '/blog', '/placement', '/login']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
    await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'networkidle' })
    await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}*{animation:none!important;transition:none!important}' })
    await p.waitForTimeout(300)
    await p.addScriptTag({ content: axeSrc })
    const res = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.any[0]?.message || x.all[0]?.message || '').slice(0, 120)) })))
    total += res.length
    console.log(`${w}px ${theme.padEnd(5)} ${path.padEnd(10)} ${res.length ? res.map((r) => `\n    ✗ ${r.id} (${r.n})\n      ` + r.ex.join('\n      ')).join('') : 'no violations'}`)
    await ctx.close()
  }
  await b.close(); process.exit(total ? 1 : 0)
})()
