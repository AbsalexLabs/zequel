import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !userData) {
      console.error('[v0] User lookup error:', userError)
      return NextResponse.json({ 
        error: 'Failed to look up user',
        details: userError?.message || 'Unknown error'
      }, { status: 500 })
    }

    const user = userData.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      console.warn('[v0] Password reset attempted for non-existent user:', email)
      return NextResponse.json({ 
        success: true,
        message: 'If the email exists, you will receive a password reset link'
      }, { status: 200 })
    }

    // Update password via admin
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error('[v0] Password update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update password',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Reset password error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
