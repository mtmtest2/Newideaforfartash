// Load every route (with and without trailing slash, light + dark) and report console errors / hydration issues.
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:4173'
;(async () => {
  const b = await chromium.launch(); let bad = 0
  for (const theme of ['light', 'dark']) for (const path of ['/', '/teachers', '/teachers/', '/blog/', '/placement/', '/login/', '/login']) {
    const p = await b.newPage(); const msgs = []
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(m.text().slice(0, 140)) })
    p.on('pageerror', (e) => msgs.push('PAGEERROR ' + e.message.slice(0, 140)))
    await p.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    await p.goto(base + path); await p.waitForTimeout(1000)
    const info = await p.evaluate(() => ({ route: document.getElementById('root').dataset.route, title: document.title, h: document.querySelector('h1,h2')?.textContent.trim().slice(0, 30) }))
    if (msgs.length) bad++
    console.log(theme.padEnd(5), path.padEnd(12), JSON.stringify(info), msgs.length ? 'ISSUES: ' + msgs.join(' || ') : 'clean')
    await p.close()
  }
  await b.close(); process.exit(bad ? 1 : 0)
})()
