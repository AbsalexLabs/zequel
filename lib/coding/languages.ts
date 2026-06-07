import type { CodingLanguage } from '@/lib/types'

export interface LanguageMeta {
  id: CodingLanguage
  label: string
  // Default file extension (without the dot)
  extension: string
  // Starter content shown when a new file of this language is created
  starter: string
}

// Single source of truth for the languages Coding Mode supports. The editor,
// the file creator, and the language picker all read from this list, so adding
// a new language later is a one-line change here plus a CodeMirror extension.
export const CODING_LANGUAGES: LanguageMeta[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    starter: `// JavaScript\nfunction greet(name) {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet('Zequel'))\n`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    extension: 'ts',
    starter: `// TypeScript\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet('Zequel'))\n`,
  },
  {
    id: 'python',
    label: 'Python',
    extension: 'py',
    starter: `# Python\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\n\nprint(greet("Zequel"))\n`,
  },
  {
    id: 'html',
    label: 'HTML',
    extension: 'html',
    starter: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Document</title>\n  </head>\n  <body>\n    <h1>Hello, Zequel!</h1>\n  </body>\n</html>\n`,
  },
  {
    id: 'css',
    label: 'CSS',
    extension: 'css',
    starter: `/* CSS */\nbody {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n}\n`,
  },
  {
    id: 'java',
    label: 'Java',
    extension: 'java',
    starter: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Zequel!");\n    }\n}\n`,
  },
  {
    id: 'cpp',
    label: 'C++',
    extension: 'cpp',
    starter: `// C++\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, Zequel!" << std::endl;\n    return 0;\n}\n`,
  },
  {
    id: 'sql',
    label: 'SQL',
    extension: 'sql',
    starter: `-- SQL\nSELECT 'Hello, Zequel!' AS greeting;\n`,
  },
]

export const LANGUAGE_MAP: Record<CodingLanguage, LanguageMeta> = CODING_LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.id] = lang
    return acc
  },
  {} as Record<CodingLanguage, LanguageMeta>
)

export function getLanguageMeta(id: CodingLanguage): LanguageMeta {
  return LANGUAGE_MAP[id] ?? LANGUAGE_MAP.javascript
}

// Infer a language from a file name extension. Falls back to JavaScript.
export function languageFromFileName(name: string): CodingLanguage {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const match = CODING_LANGUAGES.find((l) => l.extension === ext)
  if (match) return match.id
  // A few common aliases not used as the canonical extension
  if (ext === 'jsx' || ext === 'mjs' || ext === 'cjs') return 'javascript'
  if (ext === 'tsx') return 'typescript'
  if (ext === 'htm') return 'html'
  if (ext === 'cc' || ext === 'cxx' || ext === 'h' || ext === 'hpp') return 'cpp'
  return 'javascript'
}
