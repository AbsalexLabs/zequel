import { createServiceClient } from '@zequel/shared/supabase/service'
import type { RequestType } from '@zequel/shared/validation/ai-schema'

interface AIUsageLog {
  user_id: string
  endpoint: RequestType
  model: string
  input_tokens?: number
  output_tokens?: number
  status: 'success' | 'error' | 'rate_limited'
  error_message?: string
  latency_ms?: number
}

export async function logAIUsage(log: AIUsageLog): Promise<void> {
  try {
    // Use the service-role client so the insert bypasses RLS. The
    // `ai_usage_logs` table only has a SELECT policy (auth.uid() = user_id) and
    // NO insert policy, so the cookie/anon client was being silently rejected —
    // which is why the admin AI Usage page showed no data.
    const supabase = createServiceClient()
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: log.user_id,
      endpoint: log.endpoint,
      model: log.model,
      input_tokens: log.input_tokens || 0,
      output_tokens: log.output_tokens || 0,
      status: log.status,
      error_message: log.error_message || null,
      latency_ms: log.latency_ms || 0,
      created_at: new Date().toISOString(),
    })
    if (error) {
      console.error('[v0] Failed to insert AI usage log:', error.message)
    }
  } catch (err) {
    // Don't fail the request if logging fails - just console error
    console.error('[v0] Failed to log AI usage:', err)
  }
}

// Estimate token count (rough approximation: 1 token ≈ 4 chars)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
