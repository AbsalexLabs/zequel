import type { RequestType } from '@/lib/validation/ai-schema'

// Model configurations by request type
interface ModelConfig {
  primary: string
  fallback: string
  maxTokens: number
  temperature: number
}

const MODEL_CONFIGS: Record<RequestType, ModelConfig> = {
  // Chat: fast, capable model for conversations
  chat: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 16384,
    temperature: 0.4,
  },
  // Query/Research: high-quality model for structured analysis
  query: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 16384,
    temperature: 0.3,
  },
  // Extract: no AI needed, but including for completeness
  extract: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 4096,
    temperature: 0.2,
  },
}

// Premium users may get access to more powerful models
const PREMIUM_MODEL_CONFIGS: Record<RequestType, ModelConfig> = {
  chat: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 32768,
    temperature: 0.4,
  },
  query: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 32768,
    temperature: 0.3,
  },
  extract: {
    primary: 'google/gemini-2.0-flash-001',
    fallback: 'google/gemini-1.5-flash',
    maxTokens: 8192,
    temperature: 0.2,
  },
}

export function getModelConfig(requestType: RequestType, isPremium: boolean = false): ModelConfig {
  return isPremium ? PREMIUM_MODEL_CONFIGS[requestType] : MODEL_CONFIGS[requestType]
}

export function getVisionModel(): string {
  return 'google/gemini-2.0-flash-001'
}
