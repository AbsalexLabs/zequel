import { Webhook } from 'svix'
import { ingestInboundEmail } from '@zequel/shared/support/create-ticket'

/**
 * Resend Inbound Email webhook.
 *
 * Configure in Resend: point your receiving address (e.g. support@zequel.xyz)
 * at this endpoint and set RESEND_WEBHOOK_SECRET to the signing secret Resend
 * provides. Every email sent to that address becomes a Support Center ticket
 * (or threads onto an existing one when the subject carries a "[ZQ-1234]" ref).
 *
 * The `email.received` payload contains metadata only; the body is fetched
 * from the Resend Receiving API using the email id.
 */

interface ResendInboundData {
  email_id?: string
  from?: string
  to?: string | string[]
  subject?: string
  text?: string
  html?: string
}

function parseFrom(from: string | undefined): { email: string; name: string | null } {
  if (!from) return { email: '', name: null }
  // "Jane Doe <jane@example.com>" -> name + email
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) {
    return { email: match[2].trim(), name: match[1].replace(/^"|"$/g, '').trim() || null }
  }
  return { email: from.trim(), name: null }
}

function firstRecipient(to: string | string[] | undefined): string | null {
  if (!to) return null
  const value = Array.isArray(to) ? to[0] : to
  return parseFrom(value).email || value || null
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Fetch full email content from the Resend Receiving API (the webhook payload
// omits the body). Falls back gracefully if the API shape changes.
async function fetchInboundBody(emailId: string): Promise<string> {
  if (!process.env.RESEND_API_KEY) return ''
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (!res.ok) {
      console.error('[v0] Resend receiving fetch failed:', res.status)
      return ''
    }
    const data = (await res.json()) as ResendInboundData
    if (data.text && data.text.trim()) return data.text.trim()
    if (data.html) return stripHtml(data.html)
    return ''
  } catch (err) {
    console.error('[v0] Resend receiving fetch exception:', err)
    return ''
  }
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[v0] Inbound email webhook: RESEND_WEBHOOK_SECRET not set')
    return new Response('Webhook not configured', { status: 503 })
  }

  const payload = await request.text()
  const headers = {
    'svix-id': request.headers.get('svix-id') || '',
    'svix-timestamp': request.headers.get('svix-timestamp') || '',
    'svix-signature': request.headers.get('svix-signature') || '',
  }

  // Verify the signature so only Resend can create tickets here.
  let event: { type?: string; data?: ResendInboundData }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(payload, headers) as { type?: string; data?: ResendInboundData }
  } catch (err) {
    console.error('[v0] Inbound email webhook: signature verification failed', err)
    return new Response('Invalid signature', { status: 401 })
  }

  // We only care about received emails.
  if (event.type && event.type !== 'email.received' && event.type !== 'inbound.email.received') {
    return new Response('Ignored', { status: 200 })
  }

  const data = event.data || {}
  const { email, name } = parseFrom(data.from)

  if (!email) {
    return new Response('Missing sender', { status: 200 })
  }

  // Prefer the inline body if present, otherwise fetch from the Receiving API.
  let body = (data.text && data.text.trim()) || (data.html ? stripHtml(data.html) : '')
  if (!body && data.email_id) {
    body = await fetchInboundBody(data.email_id)
  }
  if (!body) body = '(empty email)'

  try {
    const result = await ingestInboundEmail({
      fromEmail: email,
      fromName: name,
      subject: data.subject || '(no subject)',
      body,
      toEmail: firstRecipient(data.to),
    })
    console.log(
      `[v0] Inbound email ingested -> ticket ${result.ref} (${result.threaded ? 'threaded' : 'new'})`,
    )
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[v0] Inbound email ingest failed:', err)
    return new Response('Ingest failed', { status: 500 })
  }
}
