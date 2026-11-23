// Run Lighthouse (mobile + desktop) against a URL and print scores, metrics, failing audits and top transfers.
// usage: CHROME_PATH=/path/to/chrome node scripts/lh.mjs http://localhost:4173/ out-prefix
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import fs from 'node:fs'

const [url, prefix = 'lh'] = process.argv.slice(2)
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] })
// RUNS=n repeats each form factor and prints the median of the key metrics (single runs vary by ~±0.3 s).
const RUNS = Number(process.env.RUNS || 1)
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
for (const formFactor of ['mobile', 'desktop']) {
  const samples = []
  const config = formFactor === 'desktop'
    ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }, emulatedUserAgent: false } }
    : { extends: 'lighthouse:default' }
  let r, lhr
  for (let i = 0; i < RUNS; i++) {
    r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, config)
    lhr = r.lhr
    samples.push({ perf: lhr.categories.performance.score * 100, fcp: lhr.audits['first-contentful-paint'].numericValue, lcp: lhr.audits['largest-contentful-paint'].numericValue, si: lhr.audits['speed-index'].numericValue, tbt: lhr.audits['total-blocking-time'].numericValue })
  }
  fs.writeFileSync(`${prefix}-${formFactor}.json`, r.report)
  const cats = Object.values(lhr.categories).map((c) => `${c.id}:${Math.round(c.score * 100)}`).join(' ')
  const m = (id) => lhr.audits[id]?.displayValue
  console.log(`\n== ${formFactor}  ${cats}`)
  console.log(`   FCP ${m('first-contentful-paint')} | LCP ${m('largest-contentful-paint')} | TBT ${m('total-blocking-time')} | CLS ${m('cumulative-layout-shift')} | SI ${m('speed-index')} | bytes ${m('total-byte-weight')}`)
  const fails = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'informative')
  for (const a of fails) console.log(`   ✗ ${a.id}: ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`)
  if (RUNS > 1) {
    const md = (k) => median(samples.map((x) => x[k]))
    console.log(`   MEDIAN of ${RUNS}: perf ${md('perf')} | FCP ${(md('fcp') / 1000).toFixed(2)} s | LCP ${(md('lcp') / 1000).toFixed(2)} s | SI ${(md('si') / 1000).toFixed(2)} s | TBT ${Math.round(md('tbt'))} ms   (LCP runs: ${samples.map((x) => (x.lcp / 1000).toFixed(2)).join(', ')})`)
  }
  const reqs = lhr.audits['network-requests']?.details?.items ?? []
  console.log('   top transfers:', reqs.sort((a, b) => b.transferSize - a.transferSize).slice(0, 6).map((q) => `${q.url.replace(/^https?:\/\/[^/]+/, '')} ${Math.round(q.transferSize / 1024)}KiB`).join(', '))
}
await chrome.kill()
