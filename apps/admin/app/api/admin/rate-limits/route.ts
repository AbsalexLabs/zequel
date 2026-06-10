import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { getTopUsersByVolume } from '@/lib/security/advanced-rate-limit'

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'violations'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const violationType = searchParams.get('violation_type')
  const userId = searchParams.get('user_id')

  const supabase = createServiceClient()

  try {
    if (type === 'top_users') {
      // Get top users by request volume from in-memory store
      const topUsers = getTopUsersByVolume(limit)
      
      // Enrich with user details
      const enrichedUsers = await Promise.all(
        topUsers.map(async (u) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', u.userId)
            .single()
          
          return {
            user_id: u.userId,
            email: profile?.email || 'Unknown',
            full_name: profile?.full_name || null,
            daily_requests: u.dailyCount,
          }
        })
      )
      
      return NextResponse.json({ users: enrichedUsers })
    }

    if (type === 'violations') {
      // Get rate limit violations from database
      let query = supabase
        .from('rate_limit_violations')
        .select(`
          id,
          user_id,
          ip_address,
          violation_type,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (violationType) {
        query = query.eq('violation_type', violationType)
      }

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: violations, count, error } = await query

      if (error) throw error

      // Enrich with user emails
      const enrichedViolations = await Promise.all(
        (violations || []).map(async (v) => {
          if (v.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', v.user_id)
              .single()
            return { ...v, email: profile?.email || null }
          }
          return { ...v, email: null }
        })
      )

      return NextResponse.json({
        violations: enrichedViolations,
        total: count || 0,
        limit,
        offset,
      })
    }

    if (type === 'stats') {
      // Get violation stats for the last 24 hours
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)

      const { data: stats, error } = await supabase
        .from('rate_limit_violations')
        .select('violation_type')
        .gte('created_at', yesterday.toISOString())

      if (error) throw error

      const violationCounts = (stats || []).reduce((acc, v) => {
        acc[v.violation_type] = (acc[v.violation_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get unique IPs with violations
      const { data: uniqueIPs } = await supabase
        .from('rate_limit_violations')
        .select('ip_address')
        .gte('created_at', yesterday.toISOString())

      const uniqueIPCount = new Set((uniqueIPs || []).map(r => r.ip_address)).size

      // Get unique users with violations
      const { data: uniqueUsers } = await supabase
        .from('rate_limit_violations')
        .select('user_id')
        .gte('created_at', yesterday.toISOString())
        .not('user_id', 'is', null)

      const uniqueUserCount = new Set((uniqueUsers || []).map(r => r.user_id)).size

      return NextResponse.json({
        period: '24h',
        total_violations: stats?.length || 0,
        by_type: violationCounts,
        unique_ips: uniqueIPCount,
        unique_users: uniqueUserCount,
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Rate limits API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limit data' },
      { status: 500 }
    )
  }
}
