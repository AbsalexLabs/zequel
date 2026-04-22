import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { generateOtp, otpEmailHtml } from '@/lib/otp'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json()

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose required' }, { status: 400 })
    }

    if (!['signup', 'reset_password', 'change_password'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate any existing unused codes for same email/purpose
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('used', false)

    // Store new code
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        purpose,
        expires_at: expiresAt,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }

    const subjectMap: Record<string, string> = {
      signup: 'Verify your Zequel account',
      reset_password: 'Reset your Zequel password',
      change_password: 'Confirm your password change',
    }

    // Send via Resend
    const { error: sendError } = await resend.emails.send({
      from: 'Zequel <noreply@mrcoolweb3.xyz>',
      to: email,
      subject: subjectMap[purpose] || 'Your Zequel verification code',
      html: otpEmailHtml({ code, purpose: purpose as 'signup' | 'reset_password' | 'change_password' }),
    })

    if (sendError) {
      console.error('[v0] Resend error:', sendError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
