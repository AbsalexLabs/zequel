/**
 * Centralized logging utility with consistent formatting
 * All logs use [v0] prefix for easy identification in logs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  operation: string
  userId?: string
  requestId?: string
  metadata?: Record<string, any>
}

const LOG_LEVEL_SYMBOLS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

/**
 * Format log message with context
 */
function formatLogMessage(level: LogLevel, context: LogContext, message: string): string {
  const parts = [
    `[v0]`,
    `[${level.toUpperCase()}]`,
    context.operation,
  ]

  if (context.userId) {
    parts.push(`user:${context.userId.substring(0, 8)}`)
  }

  if (context.requestId) {
    parts.push(`req:${context.requestId.substring(0, 8)}`)
  }

  parts.push(message)

  return parts.join(' ')
}

/**
 * Log debug message
 */
export function debug(context: LogContext, message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    const formatted = formatLogMessage('debug', context, message)
    console.debug(formatted, data || '')
  }
}

/**
 * Log info message
 */
export function info(context: LogContext, message: string, data?: any): void {
  const formatted = formatLogMessage('info', context, message)
  console.log(formatted, data || '')
}

/**
 * Log warning message
 */
export function warn(context: LogContext, message: string, data?: any): void {
  const formatted = formatLogMessage('warn', context, message)
  console.warn(formatted, data || '')
}

/**
 * Log error message
 */
export function error(context: LogContext, message: string, error?: any): void {
  const formatted = formatLogMessage('error', context, message)
  const errorDetails = error instanceof Error ? {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  } : error

  console.error(formatted, errorDetails || '')
}

/**
 * Log performance metric
 */
export function logPerformance(
  context: LogContext,
  operation: string,
  durationMs: number
): void {
  const level = durationMs > 1000 ? 'warn' : 'info'
  const logFn = level === 'warn' ? warn : info

  logFn(
    { ...context, operation: `${context.operation}:perf` },
    `${operation} completed in ${durationMs}ms`
  )
}

/**
 * Log API request
 */
export function logApiRequest(
  context: LogContext,
  method: string,
  path: string,
  body?: any
): void {
  info(context, `${method} ${path}`, process.env.NODE_ENV === 'development' ? body : undefined)
}

/**
 * Log API response
 */
export function logApiResponse(
  context: LogContext,
  statusCode: number,
  durationMs: number
): void {
  const level = statusCode >= 400 ? 'warn' : 'info'
  const logFn = level === 'warn' ? warn : info

  logFn(context, `Response ${statusCode} in ${durationMs}ms`)
}

/**
 * Log database operation
 */
export function logDatabaseOperation(
  context: LogContext,
  operation: string,
  table: string,
  status: 'success' | 'error',
  durationMs?: number
): void {
  const message = durationMs 
    ? `${operation} on ${table} (${durationMs}ms)` 
    : `${operation} on ${table}`

  const logFn = status === 'error' ? error : info
  logFn({ ...context, operation: 'database' }, message)
}

/**
 * Create a request ID for tracking
 */
export function createRequestId(): string {
  return Math.random().toString(36).substring(2, 10)
}
