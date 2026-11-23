// Which image/video requests does the home page make on first load (per theme / viewport)? Each should be fetched once.
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:4173'
;(async () => {
  const b = await chromium.launch()
  for (const [w, h, dpr] of [[390, 844, 3], [1440, 900, 1]]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
    await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    const p = await ctx.newPage(); const reqs = []
    p.on('request', (r) => { if (['image', 'media'].includes(r.resourceType())) reqs.push(r.url().replace(base, '').replace(/-[\w-]{8}\./, '.')) })
    await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(300)
    const atLoad = [...reqs]
    await p.waitForTimeout(4500) // idle prefetch window
    const counts = {}; atLoad.forEach((u) => (counts[u] = (counts[u] || 0) + 1))
    const dup = Object.entries(counts).filter(([, c]) => c > 1).map(([u]) => u)
    console.log(`${w}px dpr${dpr} ${theme}: load=[${atLoad.join(', ')}] ${dup.length ? 'DUPLICATES ' + dup : ''}\n      after idle +[${reqs.slice(atLoad.length).join(', ')}]`)
    await ctx.close()
  }
  await b.close()
})()
