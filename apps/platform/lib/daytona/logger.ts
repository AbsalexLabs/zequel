type Level = 'info' | 'warn' | 'error'

const SENSITIVE_KEY = /key|token|secret|authorization|password|cookie|content/i

function redact(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = '[redacted]'
    } else if (v instanceof Error) {
      out[k] = { name: v.name, message: v.message, statusCode: (v as { statusCode?: number }).statusCode }
    } else if (typeof v === 'string' && v.length > 300) {
      out[k] = `${v.slice(0, 300)}…`
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Structured, single-line JSON logging for the Daytona integration. Never pass
 * file contents or terminal input — sensitive-looking keys are redacted as a
 * safety net, but callers should log identifiers and outcomes only.
 */
export function logDaytona(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ scope: 'daytona', level, event, ts: new Date().toISOString(), ...redact(fields) })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}
