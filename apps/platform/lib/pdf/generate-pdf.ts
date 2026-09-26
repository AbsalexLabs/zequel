import 'server-only'
import type { Browser } from 'playwright-core'

/**
 * Only stylesheet/font hosts may be fetched while rendering. Everything else
 * (including markdown images pointing at internal addresses) is aborted so the
 * renderer cannot be used for SSRF.
 */
const ALLOWED_HOSTS = new Set(['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'])

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright-core')
  const localPath = process.env.CHROMIUM_EXECUTABLE_PATH
  if (localPath) {
    return chromium.launch({ executablePath: localPath, headless: true })
  }
  const sparticuz = (await import('@sparticuz/chromium')).default
  return chromium.launch({
    executablePath: await sparticuz.executablePath(),
    args: sparticuz.args,
    headless: true,
  })
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.protocol === 'data:' || (url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname))) {
        return route.continue()
      }
      return route.abort()
    })

    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 })
    await page.emulateMedia({ media: 'print' })
    await page.evaluate(() => document.fonts?.ready)

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-family:ui-monospace,monospace;font-size:7px;color:#888;text-align:center;">
        <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
