const { chromium } = require('../../node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.js')
;(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9228')
  const context = browser.contexts()[0]
  const page = context.pages().find(page => page.url().includes('__crud-smoke.html')) ?? await context.newPage()
  await page.setViewportSize({ width: 1440, height: 1000 })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  if (!page.url().includes('__crud-smoke.html')) await page.goto('http://127.0.0.1:5187/__crud-smoke.html')
  await page.waitForFunction(() => !!window.smoke)
  try { if (process.argv[2]) {
    const source = require('node:fs').readFileSync(process.argv[2], 'utf8')
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const scopedConsole = { log(...args) {
      console.log(...args)
      try {
        const result = JSON.parse(args[0])
        if (result.page && result.observations) {
          const reportDirectory = require('node:path').resolve(__dirname, '../../docs/reports/web-admin/2026-11-21-六个CRUD页面职责拆分')
          require('node:fs').writeFileSync(require('node:path').join(reportDirectory, `browser-${result.page}-results.json`), JSON.stringify({ executedAt: new Date().toISOString(), ...result }, null, 2))
        }
      } catch {}
    } }
    await new AsyncFunction('page', 'browser', 'errors', 'console', source)(page, browser, errors, scopedConsole)
  } else {
    await page.waitForTimeout(1000)
    console.log(JSON.stringify({ text: await page.locator('body').innerText(), errors }, null, 2))
  } } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
