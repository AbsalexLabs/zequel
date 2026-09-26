import path from 'node:path'
import { SandboxError } from './errors'

const MAX_PATH_LENGTH = 1024
const MAX_SEGMENT_LENGTH = 255
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/

function invalid(message: string): SandboxError {
  return new SandboxError('invalid_input', message, 400)
}

/**
 * Validate and normalize a project-relative path supplied by the browser.
 * Returns '' for the project root (only when `allowRoot` is set). Rejects
 * absolute paths, `..` traversal, control characters, and oversized input so a
 * request can never address anything outside the project workspace.
 */
export function normalizeRelativePath(input: unknown, { allowRoot = false } = {}): string {
  if (typeof input !== 'string') throw invalid('Path must be a string.')
  if (input.length > MAX_PATH_LENGTH) throw invalid('Path is too long.')
  if (CONTROL_CHARS.test(input)) throw invalid('Path contains invalid characters.')
  if (input.includes('\\')) throw invalid('Use forward slashes in paths.')
  if (input.startsWith('/')) throw invalid('Path must be relative to the project root.')

  const segments = input.split('/').filter((s) => s !== '' && s !== '.')
  for (const segment of segments) {
    if (segment === '..') throw invalid('Path traversal is not allowed.')
    if (segment.length > MAX_SEGMENT_LENGTH) throw invalid('A path segment is too long.')
  }
  const normalized = segments.join('/')
  if (!normalized && !allowRoot) throw invalid('A file or folder path is required.')
  return normalized
}

/** Join a validated relative path onto the project root, re-checking containment. */
export function resolveInRoot(root: string, relative: string): string {
  const cleanRoot = path.posix.normalize(root).replace(/\/+$/, '')
  if (!cleanRoot.startsWith('/')) throw new SandboxError('internal', 'Invalid project root.', 500)
  const abs = path.posix.normalize(path.posix.join(cleanRoot, relative))
  if (abs !== cleanRoot && !abs.startsWith(`${cleanRoot}/`)) {
    throw invalid('Path resolves outside the project.')
  }
  return abs
}

export function parentOf(relative: string): string {
  const idx = relative.lastIndexOf('/')
  return idx === -1 ? '' : relative.slice(0, idx)
}

export function baseName(relative: string): string {
  const idx = relative.lastIndexOf('/')
  return idx === -1 ? relative : relative.slice(idx + 1)
}

/** POSIX single-quote a value for safe interpolation into `sh -c`. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
