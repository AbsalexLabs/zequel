import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose } = await request.json()

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: 'Email, code, and purpose required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find a valid, unused, unexpired code
    const { data, error } = await supabase
      .from('otp_codes')
      .select('id, expires_at')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('purpose', purpose)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('[v0] OTP verification failed:', { email, purpose, error: error?.message })
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', data.id)

    if (updateError) {
      console.error('[v0] Failed to mark OTP as used:', updateError)
      // Still return success since verification was valid
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] OTP verify error:', error)
    return NextResponse.json({ 
      error: 'Failed to verify code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
