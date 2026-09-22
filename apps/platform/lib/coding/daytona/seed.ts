import type { SeedFile } from './types'

/**
 * A small, real test project written into every new sandbox. It is a static
 * site served by a tiny Node HTTP server so the acceptance test works with
 * only Node present (no framework install required to see a preview), while
 * still exercising `npm install` + `npm run dev` + preview URL.
 *
 * This proves the full runtime: files exist, terminal runs a real command, the
 * dev server listens on a port, and Daytona hands back a preview URL.
 */
export const SEED_PORT = 3000

export const SEED_PROJECT: SeedFile[] = [
  {
    path: 'package.json',
    content: `{
  "name": "zequel-sandbox-starter",
  "version": "1.0.0",
  "private": true,
  "description": "Zequel Coding Mode starter running in a Daytona sandbox.",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  }
}
`,
  },
  {
    path: 'server.js',
    content: `const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || ${SEED_PORT}
const ROOT = __dirname

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url === '/') url = '/index.html'
  const file = path.join(ROOT, 'public', url)
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
    res.end(data)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('Sandbox dev server listening on ' + PORT)
})
`,
  },
  {
    path: 'public/index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zequel Sandbox</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <main>
      <h1>It works.</h1>
      <p>This page is served from a real isolated Daytona sandbox.</p>
      <button id="ping">Ping the runtime</button>
      <p id="out" aria-live="polite"></p>
    </main>
    <script src="/main.js"></script>
  </body>
</html>
`,
  },
  {
    path: 'public/style.css',
    content: `:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font: 16px/1.5 ui-sans-serif, system-ui, sans-serif;
  background: #0a0a0a;
  color: #fafafa;
}
main { text-align: center; padding: 2rem; }
h1 { font-size: 2rem; margin: 0 0 .5rem; }
p { color: #a1a1aa; margin: .25rem 0; }
button {
  margin-top: 1rem;
  padding: .6rem 1rem;
  border: 1px solid #27272a;
  border-radius: .5rem;
  background: #fafafa;
  color: #0a0a0a;
  cursor: pointer;
}
`,
  },
  {
    path: 'public/main.js',
    content: `document.getElementById('ping').addEventListener('click', () => {
  document.getElementById('out').textContent = 'Runtime responded at ' + new Date().toLocaleTimeString()
})
`,
  },
  {
    path: 'README.md',
    content: `# Zequel Sandbox Starter

A minimal static site served by a small Node HTTP server, running inside a real
Daytona sandbox.

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open the preview. The dev server listens on port ${SEED_PORT}.
`,
  },
]
