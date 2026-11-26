// Teacher ↔ student flow through the real UI, with both panels open side by side in one browser
// (two tabs, shared localStorage, live sync via the storage event). usage: node scripts/e2e-teacher.cjs <base>
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:8088'
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !extra ? '' : '  -- ' + extra}`)
const ready = (p) => p.waitForSelector('#panel-content .p-page', { timeout: 10000 })

;(async () => {
  const b = await chromium.launch()
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const T = (n) => `[${vp.width < 500 ? 'phone' : 'desktop'}] ${n}`
    const ctx = await b.newContext({ viewport: vp })
    const errs = []
    const watch = (p) => { p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text())) }

    // guard + teacher login through the form
    const t = await ctx.newPage(); watch(t)
    await t.goto(base + '/teacher/assignments'); await t.waitForURL(/\/login\?role=teacher/, { timeout: 8000 }).catch(() => {})
    ok(T('teacher guard -> /login?role=teacher'), /role=teacher/.test(t.url()))
    ok(T('teacher login has no signup tab'), !(await t.isVisible('.seg')))
    await t.fill('input[inputmode=tel]', '09121112233'); await t.click('form button[type=submit]')
    await t.fill('input[name=code]', '12345'); await t.click('form button[type=submit]')
    await ready(t)
    ok(T('teacher login -> back to /teacher/assignments'), new URL(t.url()).pathname.startsWith('/teacher/assignments'))

    // student login in a second tab
    const s = await ctx.newPage(); watch(s)
    await s.goto(base + '/login?next=/panel/assignments')
    await s.click('.seg button:nth-child(2)')
    await s.fill('input[name=name]', 'مریم کاظمی'); await s.fill('input[inputmode=tel]', '09121234567'); await s.click('form button[type=submit]')
    await s.fill('input[name=code]', '12345'); await s.click('form button[type=submit]')
    await ready(s)
    ok(T('both panels signed in side by side'), new URL(s.url()).pathname.startsWith('/panel'))

    // 1. teacher creates a task -> student sees it (live, other tab)
    const title = 'تکلیف آزمایشی ' + vp.width
    await t.click('text=تکلیف تازه'); await t.fill('dialog input[name=title]', title)
    await t.fill('dialog textarea[name=desc]', 'توضیح آزمایشی'); await t.click('dialog button[type=submit]')
    await t.waitForSelector(`.p-task h2:has-text("${title}")`)
    await s.bringToFront(); await s.waitForSelector(`.p-task h2:has-text("${title}")`, { timeout: 5000 }).catch(() => {})
    ok(T('task created by teacher appears in student panel (live)'), await s.isVisible(`.p-task h2:has-text("${title}")`))

    // 2. student submits -> teacher sees it waiting
    const card = s.locator('.p-task', { hasText: title })
    await card.locator('button:has-text("ارسال پاسخ")').click()
    await s.click('dialog button[type=submit]')
    ok(T('empty answer -> inline error, field focused'), (await s.isVisible('#err-answer')) && (await s.evaluate(() => document.activeElement?.getAttribute('name'))) === 'answer')
    await s.fill('dialog textarea[name=answer]', 'This is my answer about my trip to Isfahan.')
    await s.click('dialog button[type=submit]')
    await s.waitForTimeout(300)
    ok(T('student submission shows as sent'), await card.locator('text=ارسال شد').isVisible())
    await t.bringToFront()
    await t.locator('.p-task', { hasText: title }).locator('a').click(); await t.waitForSelector('.p-subs')
    ok(T('teacher sees the submission waiting for a grade'), await t.locator('.p-subs li', { hasText: 'مریم کاظمی' }).locator('text=در انتظار نمره').isVisible())

    // 3. teacher grades -> student sees score + feedback
    await t.locator('.p-subs li', { hasText: 'مریم کاظمی' }).locator('button').click()
    await t.waitForSelector('dialog[open] .p-answer')
    ok(T('grade dialog shows the student answer'), await t.isVisible('dialog >> text=trip to Isfahan'))
    await t.fill('dialog input[name=score]', '۲۵'); await t.click('dialog button[type=submit]')
    ok(T('out-of-range score rejected inline'), await t.isVisible('#err-score'))
    await t.fill('dialog input[name=score]', '۱۸٫۵'); await t.fill('dialog textarea[name=feedback]', 'بازخورد آزمایشی استاد'); await t.click('dialog button[type=submit]')
    await t.waitForTimeout(300)
    await s.bringToFront(); await s.locator('.p-task', { hasText: title }).locator('.p-score').waitFor({ timeout: 5000 }).catch(() => {})
    const graded = s.locator('.p-task', { hasText: title })
    ok(T('student sees the grade (live)'), await graded.locator('.p-score').isVisible() && (await graded.locator('.p-score b').textContent()) === '۱۸٫۵')
    await graded.locator('button:has-text("بازخورد")').click()
    ok(T('student sees teacher feedback'), await s.isVisible('dialog >> text=بازخورد آزمایشی استاد'))
    await s.keyboard.press('Escape')

    // 4. messages both ways with unread state
    await s.goto(base + '/panel/messages?t=en-b1'); await ready(s)
    await s.fill('#p-msg', 'سلام استاد، پیام آزمایشی ' + vp.width); await s.keyboard.press('Enter')
    ok(T('student message sent with Enter'), await s.isVisible(`.p-chat-log li.mine >> text=پیام آزمایشی ${vp.width}`))
    await t.bringToFront(); await t.goto(base + '/teacher/messages?t=en-b1~me'); await ready(t)
    ok(T('teacher receives the student message'), await t.isVisible(`.p-chat-log li.theirs >> text=پیام آزمایشی ${vp.width}`))
    await t.fill('#p-msg', 'سلام مریم، پاسخ آزمایشی'); await t.click('.p-send')
    await s.bringToFront(); await s.waitForTimeout(400)
    ok(T('student receives the reply (live)'), await s.isVisible('.p-chat-log li.theirs >> text=پاسخ آزمایشی'))
    ok(T('student message marked read by teacher'), (await s.locator('.p-chat-log li.mine .p-tick').last().getAttribute('aria-label')) === 'خوانده شد')

    // 5. announcement -> student dashboard + notifications
    await t.bringToFront(); await t.goto(base + '/teacher/classes?id=en-b1&tab=news'); await ready(t)
    await t.fill('input[name=title]', 'اطلاعیهٔ آزمایشی'); await t.fill('textarea[name=text]', 'کلاس شنبه در اتاق شمارهٔ دو برگزار می‌شود.')
    await t.click('form button[type=submit]')
    await s.bringToFront(); await s.goto(base + '/panel'); await ready(s)
    ok(T('announcement shows on student dashboard'), await s.isVisible('text=اطلاعیهٔ آزمایشی'))
    await s.click('.p-notif > button')
    ok(T('announcement in student notifications'), await s.isVisible('.p-notif-menu >> text=اطلاعیهٔ آزمایشی'))
    await s.keyboard.press('Escape')

    // 6. attendance -> student course card
    await t.bringToFront(); await t.goto(base + '/teacher/attendance'); await ready(t)
    const meRow = t.locator('.p-att li', { hasText: 'مریم کاظمی' })
    const course = (await t.locator('.p-att-head h2').textContent()).trim()
    await meRow.locator('label.k-absent').click(); await t.click('.p-att-foot button')
    ok(T('attendance saved'), await t.isVisible('.p-att-foot .ok'))
    await s.bringToFront(); await s.goto(base + '/panel/courses'); await ready(s)
    const line = await s.locator('.p-course', { hasText: course.split(' ')[0] }).locator('.p-course-line', { hasText: 'حضور' }).first().textContent()
    ok(T('student attendance reflects teacher marks'), /حضور/.test(line), line)

    // no horizontal overflow on any teacher page
    for (const pg of ['', 'classes', 'classes?id=en-b1', 'schedule', 'assignments', 'attendance', 'messages', 'profile']) {
      await t.goto(base + '/teacher/' + pg); await ready(t)
      ok(T(`teacher ${pg || 'home'} no horizontal overflow`), !(await t.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)))
    }
    ok(T('no console/page errors'), errs.length === 0, errs.slice(0, 3).join(' | '))
    await ctx.close()
  }
  await b.close()
  console.log(results.join('\n'))
  process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
})()
