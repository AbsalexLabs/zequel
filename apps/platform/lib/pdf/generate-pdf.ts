import PDFDocument from 'pdfkit'

function stripMarkdownFormatting(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, '') // Remove heading symbols
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italics
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/^\s*[-*+]\s+/gm, '• ') // List bullets
    .replace(/^\s*\d+\.\s+/gm, (match) => match) // Numbered lists
    .replace(/\$(.*?)\$/g, '$1') // Math inline
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  // Try Playwright Chromium first (if available in current server environment)
  try {
    const { chromium } = await import('playwright-core')
    const localPath = process.env.CHROMIUM_EXECUTABLE_PATH

    let browser
    if (localPath) {
      browser = await chromium.launch({ executablePath: localPath, headless: true })
    } else {
      const signalsAl2023 =
        /20\.x|22\.x/.test(process.env.AWS_EXECUTION_ENV ?? '') ||
        /20\.x|22\.x/.test(process.env.AWS_LAMBDA_JS_RUNTIME ?? '') ||
        /nodejs20|nodejs22/.test(process.env.CODEBUILD_BUILD_IMAGE ?? '') ||
        (Boolean(process.env.VERCEL) && Number.parseInt(process.versions.node, 10) >= 20)

      if (!signalsAl2023) {
        const major = Number.parseInt(process.versions.node, 10)
        process.env.AWS_LAMBDA_JS_RUNTIME = `nodejs${major >= 22 ? 22 : 20}.x`
      }

      const sparticuz = (await import('@sparticuz/chromium')).default
      browser = await chromium.launch({
        executablePath: await sparticuz.executablePath(),
        args: sparticuz.args,
        headless: true,
      })
    }

    try {
      const context = await browser.newContext()
      const page = await context.newPage()

      const ALLOWED_HOSTS = new Set(['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'])
      await page.route('**/*', (route) => {
        try {
          const url = new URL(route.request().url())
          if (
            url.protocol === 'data:' ||
            url.protocol === 'about:' ||
            (url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname))
          ) {
            return route.continue()
          }
        } catch {
          // Fall through to abort
        }
        return route.abort()
      })

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10_000 })
      await page.emulateMedia({ media: 'print' })

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
  } catch (chromiumError) {
    console.warn('[htmlToPdf] Chromium rendering unavailable or failed, using PDFKit fallback:', chromiumError)
    return generatePdfKitFallback(html)
  }
}

function generatePdfKitFallback(html: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      })

      const buffers: Buffer[] = []
      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', (err) => reject(err))

      // Extract title from HTML <title> tag or default
      const titleMatch = /<title>(.*?)<\/title>/i.exec(html)
      const title = titleMatch ? titleMatch[1] : 'Zequel Response'

      // Header
      doc.font('Helvetica-Bold').fontSize(16).text('Zequel', { align: 'left' })
      doc.font('Helvetica').fontSize(10).fillColor('#666666').text(title, { align: 'left' })
      doc.moveDown(0.5)
      doc.strokeColor('#E5E5E5').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(1)

      // Strip HTML tags into lines and paragraphs
      const bodyText = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()

      const cleanContent = stripMarkdownFormatting(bodyText)

      doc.font('Helvetica').fontSize(10).fillColor('#111111').text(cleanContent, {
        align: 'left',
        lineGap: 4,
      })

      // Add page numbers
      const range = doc.bufferedPageRange()
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i)
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#888888')
          .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, {
            align: 'center',
            width: doc.page.width - 100,
          })
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
