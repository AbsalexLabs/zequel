import { z } from 'zod'

// Chat request validation
export const chatRequestSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  message: z.string().max(8000, 'Message too long (max 8000 chars)').optional(),
  document_id: z.string().uuid().nullable().optional(),
  images: z.array(z.string().url().or(z.string().startsWith('data:image/'))).max(5, 'Max 5 images allowed').optional(),
  full_content: z.string().max(500000).optional(),
  regenerate: z.boolean().optional(),
})

// Query/Research request validation
export const queryRequestSchema = z.object({
  query: z.string().min(1, 'Query required').max(2000, 'Query too long (max 2000 chars)'),
  output_format: z.enum(['summarize', 'extract_claims', 'compare_methodology', 'identify_contradictions', 'define_key_terms', 'extract_research_gaps']),
  document_ids: z.array(z.string().uuid()).min(1, 'At least one document required').max(5, 'Max 5 documents'),
})

// Document extraction request validation
export const extractRequestSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  filePath: z.string().min(1, 'File path required'),
})

// Request types
export type RequestType = 'chat' | 'query' | 'extract'

// Generic validation function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}
