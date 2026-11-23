// Run Lighthouse (mobile + desktop) against a URL and print scores, metrics, failing audits and top transfers.
// usage: CHROME_PATH=/path/to/chrome node scripts/lh.mjs http://localhost:4173/ out-prefix
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import fs from 'node:fs'

const [url, prefix = 'lh'] = process.argv.slice(2)
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] })
for (const formFactor of ['mobile', 'desktop']) {
  const config = formFactor === 'desktop'
    ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }, emulatedUserAgent: false } }
    : { extends: 'lighthouse:default' }
  const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, config)
  const lhr = r.lhr
  fs.writeFileSync(`${prefix}-${formFactor}.json`, r.report)
  const cats = Object.values(lhr.categories).map((c) => `${c.id}:${Math.round(c.score * 100)}`).join(' ')
  const m = (id) => lhr.audits[id]?.displayValue
  console.log(`\n== ${formFactor}  ${cats}`)
  console.log(`   FCP ${m('first-contentful-paint')} | LCP ${m('largest-contentful-paint')} | TBT ${m('total-blocking-time')} | CLS ${m('cumulative-layout-shift')} | SI ${m('speed-index')} | bytes ${m('total-byte-weight')}`)
  const fails = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'informative')
  for (const a of fails) console.log(`   ✗ ${a.id}: ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`)
  const reqs = lhr.audits['network-requests']?.details?.items ?? []
  console.log('   top transfers:', reqs.sort((a, b) => b.transferSize - a.transferSize).slice(0, 6).map((q) => `${q.url.replace(/^https?:\/\/[^/]+/, '')} ${Math.round(q.transferSize / 1024)}KiB`).join(', '))
}
await chrome.kill()
