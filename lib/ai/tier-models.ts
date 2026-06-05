import type { SubscriptionPlan } from '@/lib/security/subscription'

/**
 * Zequel workspace modes that determine feature availability
 */
export type WorkspaceMode = 'normal' | 'study' | 'research' | 'multi_doc' | 'coding' | 'deep_reasoning'

/**
 * Feature requirements per mode - determines which tier is needed
 */
export const MODE_FEATURE_MAP: Record<WorkspaceMode, SubscriptionPlan[]> = {
  // Available to all tiers
  'normal': ['free', 'premium_lite', 'premium_pro'],
  'study': ['free', 'premium_lite', 'premium_pro'],
  
  // Premium Lite and above
  'research': ['premium_lite', 'premium_pro'],
  'multi_doc': ['premium_lite', 'premium_pro'],
  
  // Premium Pro only
  'coding': ['premium_pro'],
  'deep_reasoning': ['premium_pro'],
}

/**
 * Hardcoded model defaults by subscription tier
 * Used as fallback when system settings don't have overrides
 */
export const DEFAULT_TIER_MODELS: Record<SubscriptionPlan, string> = {
  free: 'openai/gpt-5-nano',
  premium_lite: 'openai/gpt-5-mini',
  premium_pro: 'openai/gpt-5',
}

/**
 * Research-specific model override
 * Premium Lite gets GPT-5 for research mode only
 */
export const RESEARCH_MODE_OVERRIDES: Record<SubscriptionPlan, string | null> = {
  free: null,
  premium_lite: 'openai/gpt-5', // Premium Lite gets GPT-5 for research mode
  premium_pro: 'openai/gpt-5',
}

/**
 * Vision model for image handling
 * All tiers use nano for vision tasks to save costs
 */
export const VISION_MODEL = 'openai/gpt-5-nano'

/**
 * Fallback model if all else fails
 */
export const FALLBACK_MODEL = 'google/gemini-1.5-flash'

/**
 * Get the appropriate model for a user's tier
 * Priority: system settings override > research mode override > tier default
 * 
 * @param plan - User's subscription plan
 * @param mode - Current workspace mode
 * @param overrideModel - Optional override from system settings
 * @returns The model string to use
 */
export function getTierModel(
  plan: SubscriptionPlan,
  mode: WorkspaceMode = 'normal',
  overrideModel?: string
): string {
  // Priority 1: System settings override (admin has explicitly set this)
  if (overrideModel) {
    return overrideModel
  }

  // Priority 2: Research mode special handling for Premium Lite
  if (mode === 'research') {
    const researchModel = RESEARCH_MODE_OVERRIDES[plan]
    if (researchModel) {
      return researchModel
    }
  }

  // Priority 3: Tier default
  return DEFAULT_TIER_MODELS[plan]
}

/**
 * Check if a user can access a particular mode
 */
export function canAccessMode(plan: SubscriptionPlan, mode: WorkspaceMode): boolean {
  const allowedPlans = MODE_FEATURE_MAP[mode] || []
  return allowedPlans.includes(plan)
}
