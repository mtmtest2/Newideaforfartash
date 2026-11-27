// axe-core (WCAG 2 A/AA) on every page, both themes, desktop + phone, with scroll-reveal content forced visible
// so nothing is skipped as hidden. usage: node scripts/axe.cjs http://localhost:8088
const { chromium } = require('playwright')
const fs = require('fs')
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const base = process.argv[2] || 'http://localhost:8088'
const { accounts, sessionCookies, testIp } = require('./e2e-accounts.cjs')
;(async () => {
  const b = await chromium.launch(); let total = 0
  // real sessions (the panels are guarded by the server now)
  const acc = await accounts(base)
  const jar = {
    member: await sessionCookies(base, acc.student), teacher: await sessionCookies(base, acc.teacher, true), reception: await sessionCookies(base, acc.reception, true),
    owner: await sessionCookies(base, { username: process.env.E2E_OWNER_USERNAME || 'owner.demo', password: process.env.E2E_OWNER_PASSWORD || 'Malek-Fartash-2026' }, true),
    support: await sessionCookies(base, acc.support, true), supervisor: await sessionCookies(base, acc.supervisor, true),
  }
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) for (const path of ['/', '/teachers', '/magazine', '/magazine/english-speaking-skills', '/teachers/arman-kiani', '/languages/english', '/events', '/no-such-page', '/placement', '/login', '/panel', '/panel/courses', '/panel/schedule', '/panel/assignments', '/panel/recordings', '/panel/certificates', '/panel/payments', '/panel/support', '/panel/profile', '/panel/messages?t=g-en-b1',
    '/teacher', '/teacher/classes', '/teacher/classes?id=en-b1', '/teacher/schedule', '/teacher/assignments', '/teacher/assignments?task=a4', '/teacher/attendance', '/teacher/messages?t=g-en-b1', '/teacher/profile', '/reception', '/reception/classes', '/reception/classes?id=en-b1', '/reception/groups?t=g-en-b1', '/reception/account',
    '/register', '/staff/login', '/owner', '/owner/staff', '/owner/members', '/owner/account', '/support-desk', '/support-desk/staff', '/supervisor']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': testIp() } })
    await ctx.addInitScript((t) => localStorage.setItem('fartash-theme', t), theme)
    // panel pages need a real session; /login and /staff/login would redirect away with one, so only set it there
    const area = { panel: 'member', teacher: 'teacher', reception: 'reception', owner: 'owner', 'support-desk': 'support', supervisor: 'supervisor' }[path.split(/[/?]/)[1]]
    if (area) await ctx.addCookies(jar[area])
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'networkidle' })
    if (area) await p.waitForSelector('#panel-content .p-page')
    await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}*{animation:none!important;transition:none!important}' })
    await p.waitForTimeout(300)
    await p.addScriptTag({ content: axeSrc })
    const res = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.any[0]?.message || x.all[0]?.message || '').slice(0, 120)) })))
    total += res.length
    console.log(`${w}px ${theme.padEnd(5)} ${path.padEnd(30)} ${res.length ? res.map((r) => `\n    ✗ ${r.id} (${r.n})\n      ` + r.ex.join('\n      ')).join('') : 'no violations'}`)
    await ctx.close()
  }
  await b.close(); process.exit(total ? 1 : 0)
})()
