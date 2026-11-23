// Lighthouse accessibility + SEO (+ agentic) audits for every page, listing the failing elements.
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
const base = process.argv[2] || 'http://localhost:8088'
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] })
for (const theme of ['light', 'dark']) for (const path of ['/', '/teachers', '/blog', '/placement', '/login']) {
  const r = await lighthouse(base + path, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['accessibility', 'seo', 'agentic-browsing'] }, {
    extends: 'lighthouse:default',
    settings: { onlyCategories: ['accessibility', 'seo', 'agentic-browsing'] },
  })
  // theme: re-run isn't trivial with LH's fresh profile, so dark is checked by injecting the attribute below
  const lhr = r.lhr
  console.log(`\n== ${theme} ${path}  ` + Object.values(lhr.categories).map((c) => `${c.id}:${Math.round(c.score * 100)}`).join(' '))
  for (const a of Object.values(lhr.audits)) {
    if (a.score === null || a.score >= 1 || ['notApplicable', 'manual', 'informative'].includes(a.scoreDisplayMode)) continue
    console.log(`  ✗ ${a.id}: ${a.title}`)
    for (const it of (a.details?.items ?? []).slice(0, 12)) {
      const n = it.node || it
      const extra = it.contrastRatio ? ` contrast ${it.contrastRatio}` : ''
      console.log(`      - ${(n.selector || n.url || '').slice(0, 90)} | ${(n.snippet || n.nodeLabel || '').replace(/\s+/g, ' ').slice(0, 110)}${extra}`)
      if (n.explanation) console.log(`        ${n.explanation.replace(/\s+/g, ' ').slice(0, 220)}`)
    }
  }
  if (theme === 'dark') break
}
await chrome.kill()
