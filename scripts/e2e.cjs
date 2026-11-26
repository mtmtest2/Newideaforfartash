// End-to-end check of interactive features on the production build. usage: node scripts/e2e.cjs http://localhost:8088
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:8088'
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`)
;(async () => {
  const b = await chromium.launch()
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } })
    const p = await ctx.newPage(); const errs = []
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    const T = (n) => `[${tag}] ${n}`
    // the site uses scroll-behavior: smooth, so wait for scrolling to stop instead of a fixed delay
    const settle = async () => { let last = -1; for (let i = 0; i < 60; i++) { const y = await p.evaluate(() => scrollY); if (y === last) return y; last = y; await p.waitForTimeout(150) } return last }
    const instant = (sel, off = -100) => p.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + o, behavior: 'instant' }) }, [sel, off])

    await p.goto(base + '/'); await p.waitForTimeout(700)
    // theme toggle + persistence + hero swap
    const t0 = await p.evaluate(() => document.documentElement.dataset.theme)
    await p.click('.theme-toggle'); await p.waitForTimeout(1400)
    const t1 = await p.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem('fartash-theme'), getComputedStyle(document.querySelector(document.documentElement.dataset.theme === 'dark' ? '.swap-night' : '.swap-day')).display, document.querySelector('.theme-toggle').getAttribute('aria-pressed')])
    ok(T('theme toggle + saved + active hero shown'), t1[0] !== t0 && t1[1] === t1[0] && t1[2] !== 'none' && t1[3] === String(t1[0] === 'dark'), t1.join('/'))
    const heroLoaded = await p.evaluate(() => { const i = document.querySelector((document.documentElement.dataset.theme === 'dark' ? '.swap-night' : '.swap-day') + ' img'); return i.complete && i.naturalWidth > 0 })
    ok(T('hero image of new theme loaded'), heroLoaded)
    await p.reload(); await p.waitForTimeout(500)
    ok(T('theme persists after reload'), (await p.evaluate(() => document.documentElement.dataset.theme)) === t1[0])
    await p.click('.theme-toggle'); await p.waitForTimeout(600)

    // navigation: header (desktop) / bottom bar (phone), then logo back home
    const navSel = tag === 'desktop' ? 'header nav' : '.bottom-nav'
    for (const [href, check] of [['/teachers', '.prof-grid .prof-card'], ['/blog', '.post-grid .post'], ['/#contact', '#contact'], ['/#steps', '#steps']]) {
      await p.click(`${navSel} a[href="${href}"]`); await p.waitForTimeout(300); await settle()
      const r = await p.evaluate((c) => [location.pathname + location.hash, document.querySelectorAll(c).length, Math.round(document.querySelector(c)?.getBoundingClientRect().top ?? -1)], check)
      ok(T(`nav ${href}`), r[1] > 0 && (href.includes('#') ? Math.abs(r[2]) < 200 : true), r.join(' '))
      await p.click('header .logo'); await p.waitForTimeout(300); await settle()
      ok(T(`logo -> home after ${href}`), (await p.evaluate(() => location.pathname + '|' + Math.round(scrollY))) === '/|0')
    }

    // professors carousel: autoplay, arrows, tabs
    await instant('.prof-wrap'); await p.waitForTimeout(800)
    const act = () => p.evaluate(() => document.querySelector('.prof-card[data-state=active] .lang-chip').textContent.trim())
    const a0 = await act(); await p.evaluate(() => document.querySelector('.prof-wrap .nav-next').click()); await p.waitForTimeout(300)
    const a1 = await act(); await p.evaluate(() => document.querySelector('.prof-wrap .nav-prev').click()); await p.waitForTimeout(300)
    ok(T('professor arrows next/prev'), a1 !== a0 && (await act()) === a0, `${a0} -> ${a1}`)
    await p.evaluate(() => document.querySelectorAll('.prof-tab')[3].click()); await p.waitForTimeout(300)
    ok(T('professor tab select'), (await act()).includes('عربی'))
    await p.mouse.move(1, 1); await p.waitForTimeout(5600)
    ok(T('professor autoplay'), !(await act()).includes('عربی'))
    ok(T('professor photo loaded'), await p.evaluate(() => { const i = document.querySelector('.prof-card[data-state=active] .prof-photo img'); return i.complete && i.naturalWidth > 0 }))

    // blog coverflow
    await instant('.cf'); await p.waitForTimeout(700)
    const pb = () => p.evaluate(() => document.querySelector('.post[data-off="0"] h3').textContent)
    const b0 = await pb(); await p.evaluate(() => document.querySelector('.cf .nav-next').click()); await p.waitForTimeout(400)
    ok(T('blog carousel arrow'), (await pb()) !== b0)
    ok(T('blog center image loaded'), await p.evaluate(() => { const i = document.querySelector('.post[data-off="0"] img'); return i.complete && i.naturalWidth > 0 }))

    // FAQ accordion + consult form validation
    await instant('#contact'); await p.waitForTimeout(500)
    await p.evaluate(() => document.querySelectorAll('.faq-item h3 button')[2].click()); await p.waitForTimeout(500)
    ok(T('FAQ opens item 3'), await p.evaluate(() => document.querySelectorAll('.faq-item')[2].classList.contains('open') && document.querySelectorAll('.faq-item h3 button')[2].getAttribute('aria-expanded') === 'true'))
    await p.fill('.consult input[name=name]', 'تست'); await p.fill('.consult input[name=phone]', '123'); await p.click('.consult button[type=submit]'); await p.waitForTimeout(200)
    ok(T('consult form rejects bad phone'), await p.isVisible('.consult .err'))
    await p.fill('.consult input[name=phone]', '۰۹۱۲۳۴۵۶۷۸۹'); await p.click('.consult button[type=submit]'); await p.waitForTimeout(200)
    ok(T('consult form accepts Persian-digit phone'), await p.isVisible('.consult .ok'))

    // intro video: lazy source, plays when visible, sound toggle
    // fresh navigation (a reload would restore the previous scroll position next to the video)
    await p.goto(base + '/'); await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(600)
    ok(T('video has no src before scrolling'), (await p.evaluate(() => document.querySelector('video').getAttribute('src'))) === null)
    await instant('.video-card', -150); await p.waitForTimeout(2500)
    const v = await p.evaluate(() => { const v = document.querySelector('video'); return [v.getAttribute('src'), v.getAttribute('poster'), !v.paused, v.readyState] })
    ok(T('video source attached + playing'), !!v[0] && !!v[1] && v[2] && v[3] >= 2, `${(v[0] || '').replace(/.*\//, '')} playing=${v[2]}`)
    ok(T(`video picks ${tag === 'phone' ? '720p' : '1080p'}`), (v[0] || '').includes(tag === 'phone' ? '720' : '1080'))
    await p.evaluate(() => document.querySelector('.sound-btn').click()); await p.waitForTimeout(200)
    ok(T('video sound toggle'), await p.evaluate(() => !document.querySelector('video').muted && document.querySelector('.sound-btn').getAttribute('aria-pressed') === 'true'))

    // placement form
    await p.goto(base + '/placement'); await p.waitForTimeout(600)
    await p.fill('input[name=name]', 'تست'); await p.fill('input[name=phone]', '09121234567'); await p.click('.placement-card button[type=submit]'); await p.waitForTimeout(200)
    ok(T('placement form submits'), await p.isVisible('.ok-box'))

    // login flow
    await p.goto(base + '/login'); await p.waitForTimeout(600)
    await p.fill('input[inputmode=tel]', '09121234567'); await p.click('form button[type=submit]'); await p.waitForTimeout(200)
    await p.fill('input[name=code]', '12345'); await p.click('form button[type=submit]')
    await p.waitForSelector('#panel-content .p-page', { timeout: 8000 }).catch(() => {})
    ok(T('login phone -> code -> panel'), new URL(p.url()).pathname.startsWith('/panel') && await p.isVisible('#panel-content .p-page'))
    for (const sec of ['courses', 'schedule', 'assignments', 'recordings', 'certificates', 'payments', 'support', 'profile']) {
      await p.goto(base + '/panel/' + sec); await p.waitForSelector('#panel-content .p-page', { timeout: 8000 }).catch(() => {})
      const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
      ok(T('panel ' + sec + ' renders, no horizontal overflow'), await p.isVisible('#panel-content .p-page') && !wide)
    }
    await p.click('text=خروج از حساب').catch(async () => { await p.goto(base + '/panel/profile'); await p.click('.p-page >> text=خروج') })
    await p.waitForTimeout(400)
    await p.goto(base + '/panel'); await p.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {})
    ok(T('panel guard redirects to login after sign-out'), new URL(p.url()).pathname.startsWith('/login'))

    ok(T('no console/page errors'), errs.length === 0, errs.slice(0, 2).join(' | '))
    await ctx.close()
  }
  await b.close()
  console.log(results.join('\n'))
  process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
})()
