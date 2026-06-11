import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { Resend } from 'resend'

const SUPPORT_FROM = 'Zequel Support <support@zequel.xyz>'

function supportEmailHtml({ ticketRef, subject, body }: { ticketRef: string; subject: string; body: string }) {
  const safeBody = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
    <h2 style="font-size:16px;margin:0 0 4px;">Zequel Support</h2>
    <p style="font-size:12px;color:#666;margin:0 0 16px;">Re: ${subject} · ${ticketRef}</p>
    <div style="font-size:14px;line-height:1.6;">${safeBody}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="font-size:11px;color:#999;">Reply to this email to continue the conversation. Ticket ${ticketRef}.</p>
  </div>`
}

// Post a new message to a ticket. kind: admin (reply) | email | note.
//   admin / email -> stored AND emailed to the ticket's user via Resend.
//   note          -> stored as an internal note, never emailed.
// Admin only.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const kind = typeof body?.kind === 'string' ? body.kind : ''
  const text = typeof body?.body === 'string' ? body.body.trim() : ''

  if (!['admin', 'email', 'note'].includes(kind)) {
    return adminError('Invalid message kind', 400)
  }
  if (!text) {
    return adminError('Message body is required', 400)
  }

  const supabase = createServiceClient()

  // Load the ticket so we know who to email.
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, ref, subject, user_email')
    .eq('id', id)
    .single()

  if (ticketError || !ticket) {
    return adminError(ticketError?.message || 'Ticket not found', 404)
  }

  const insert: Record<string, unknown> = {
    ticket_id: id,
    kind,
    author: user.name,
    author_id: user.id,
    body: text,
  }

  let emailed = false

  // Admin reply and Email both send an email to the user.
  if (kind === 'admin' || kind === 'email') {
    const subject = `Re: ${ticket.subject} [${ticket.ref}]`
    insert.email_from = SUPPORT_FROM
    insert.email_to = ticket.user_email
    insert.email_subject = subject

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error: sendError } = await resend.emails.send({
          from: SUPPORT_FROM,
          to: ticket.user_email,
          subject,
          html: supportEmailHtml({ ticketRef: ticket.ref, subject: ticket.subject, body: text }),
        })
        emailed = !sendError
        if (sendError) {
          console.error('[v0] Support email send error:', sendError)
        }
      } catch (err) {
        console.error('[v0] Support email exception:', err)
      }
    }
  }

  const { data: message, error: insertError } = await supabase
    .from('support_messages')
    .insert(insert)
    .select(
      `id, kind, author, author_id, body, event, email_from, email_to, email_subject, attachments, created_at`,
    )
    .single()

  if (insertError) {
    return adminError(insertError.message, 500)
  }

  return adminResponse({ message, emailed })
}
