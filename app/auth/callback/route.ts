import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback route for handling email confirmation and OAuth redirects
 * This is required for email confirmation links and OAuth provider callbacks
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[v0] Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`,
        request.url,
      ),
    )
  }

  // Handle email confirmation and OAuth code exchange
  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[v0] Code exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(
            `/auth/error?error=${encodeURIComponent(exchangeError.message)}`,
            request.url,
          ),
        )
      }

      // Successfully authenticated, redirect to workspace
      return NextResponse.redirect(new URL('/workspace', request.url))
    } catch (err) {
      console.error('[v0] Auth callback error:', err)
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=Authentication+failed`,
          request.url,
        ),
      )
    }
  }

  // No code or error provided
  console.warn('[v0] Auth callback called without code or error')
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
