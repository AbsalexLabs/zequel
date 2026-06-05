import type { RequestType } from '@/lib/validation/ai-schema'
import type { SubscriptionPlan } from '@/lib/security/subscription'
import { getTierModel, VISION_MODEL, FALLBACK_MODEL, type WorkspaceMode } from '@/lib/ai/tier-models'
import { getTierModelOverride } from '@/lib/settings/system-settings'

/**
 * Model configuration for different request types
 */
interface ModelConfig {
  primary: string
  fallback: string
  maxTokens: number
  temperature: number
}

/**
 * Temperature settings by request type
 */
const REQUEST_TEMPERATURES: Record<RequestType, number> = {
  chat: 0.4,      // Conversational, balanced
  query: 0.3,     // Research, more deterministic
  extract: 0.2,   // Extraction, very deterministic
}

/**
 * Max token limits by request type and subscription tier
 */
const MAX_TOKENS_BY_TIER: Record<SubscriptionPlan, Record<RequestType, number>> = {
  free: {
    chat: 8192,
    query: 8192,
    extract: 4096,
  },
  premium_lite: {
    chat: 16384,
    query: 16384,
    extract: 8192,
  },
  premium_pro: {
    chat: 32768,
    query: 32768,
    extract: 16384,
  },
}

/**
 * Get model configuration based on subscription tier, request type, and workspace mode
 * 
 * Priority:
 * 1. System settings override (from admin dashboard)
 * 2. Research mode special handling (Premium Lite gets GPT-5 for research)
 * 3. Tier defaults (Free=Nano, Premium Lite=Mini, Premium Pro=GPT-5)
 * 
 * @param requestType - Type of request: chat, query, extract
 * @param plan - User's subscription plan
 * @param workspaceMode - Current workspace mode (e.g., 'normal', 'research', 'coding')
 * @returns Configuration including model, fallback, tokens, temperature
 */
export async function getModelConfig(
  requestType: RequestType,
  plan: SubscriptionPlan = 'free',
  workspaceMode: WorkspaceMode = 'normal'
): Promise<ModelConfig> {
  // Get tier-specific model, checking system settings override first
  const override = await getTierModelOverride(plan, workspaceMode === 'research' ? 'research' : undefined)
  const primaryModel = getTierModel(plan, workspaceMode, override)

  // Get max tokens based on tier and request type
  const maxTokens = MAX_TOKENS_BY_TIER[plan][requestType]
  const temperature = REQUEST_TEMPERATURES[requestType]

  return {
    primary: primaryModel,
    fallback: FALLBACK_MODEL,
    maxTokens,
    temperature,
  }
}

/**
 * Get vision model for image processing
 * Uses nano model for all tiers to optimize costs
 */
export function getVisionModel(): string {
  return VISION_MODEL
}

/**
 * Get fallback model
 */
export function getFallbackModel(): string {
  return FALLBACK_MODEL
}
