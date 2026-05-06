import { NextResponse } from 'next/server'

/**
 * Standardized error response builder for API routes
 * All errors logged with [v0] prefix for easy debugging
 */

export interface ApiErrorResponse {
  error: string
  details?: string
  code?: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
}

/**
 * Create a standardized error response
 * Logs error with [v0] prefix and returns JSON response
 */
export function handleApiError(
  error: unknown,
  userMessage: string = 'An error occurred',
  statusCode: number = 500,
  context: string = 'API'
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined

  console.error(`[v0] ${context} error:`, {
    message: errorMessage,
    code: errorCode,
    fullError: error,
  })

  return NextResponse.json(
    {
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      code: errorCode,
    },
    { status: statusCode }
  )
}

/**
 * Validate required fields in request
 * Returns error response if any fields are missing
 */
export function validateRequired(
  fields: Record<string, any>,
  fieldNames: string[]
): { valid: boolean; error?: NextResponse } {
  const missing = fieldNames.filter((name) => !fields[name])

  if (missing.length > 0) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: 'Missing required fields',
          details: `Required: ${missing.join(', ')}`,
        },
        { status: 400 }
      ),
    }
  }

  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): { valid: boolean; error?: NextResponse } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: 'File type not allowed',
          details: `Allowed types: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      ),
    }
  }

  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSizeBytes: number
): { valid: boolean; error?: NextResponse } {
  if (fileSize > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0)
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: 'File too large',
          details: `Maximum file size is ${maxSizeMB}MB`,
        },
        { status: 400 }
      ),
    }
  }

  return { valid: true }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback?: T
): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(json)
    return { success: true, data }
  } catch (error) {
    console.error('[v0] JSON parse error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      data: fallback,
    }
  }
}

/**
 * Log with structured format
 */
export function logOperation(
  operation: string,
  status: 'start' | 'success' | 'error',
  details?: any
): void {
  const statusSymbol = status === 'success' ? '✓' : status === 'error' ? '✗' : '→'
  console.log(`[v0] ${statusSymbol} ${operation}`, details ? { details } : '')
}
