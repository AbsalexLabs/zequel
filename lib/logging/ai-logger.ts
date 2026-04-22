import { createClient as createServerClient } from '@/lib/supabase/server'
import type { RequestType } from '@/lib/validation/ai-schema'

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
    const supabase = await createServerClient()
    await supabase.from('ai_usage_logs').insert({
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
  } catch (err) {
    // Don't fail the request if logging fails - just console error
    console.error('Failed to log AI usage:', err)
  }
}

// Estimate token count (rough approximation: 1 token ≈ 4 chars)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
