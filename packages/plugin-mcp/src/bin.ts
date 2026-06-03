#!/usr/bin/env node
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { readConfig, createServiceClient } from './config.js'
import { buildMcpServer, SERVER_NAME, SERVER_VERSION } from './server.js'

const DEFAULT_PORT = 8765

interface Cli {
  http: boolean
  port: number
  help: boolean
}

export function parseArgs(argv: string[]): Cli {
  const cli: Cli = { http: false, port: DEFAULT_PORT, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--http') cli.http = true
    else if (arg === '--help' || arg === '-h') cli.help = true
    else if (arg === '--port' || arg === '-p') {
      const next = argv[++i]
      const port = Number(next)
      if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`--port expects an integer 1-65535, got "${next ?? ''}"`)
      }
      cli.port = port
    } else if (arg.startsWith('--port=')) {
      const port = Number(arg.slice('--port='.length))
      if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`--port expects an integer 1-65535, got "${arg}"`)
      }
      cli.port = port
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return cli
}

const USAGE = `${SERVER_NAME} v${SERVER_VERSION} — MCP server for IMBA CMS blog content

Usage:
  imba-mcp                       Start over stdio (default; for local agents)
  imba-mcp --http [--port <n>]   Start a streamable-HTTP server (default port ${DEFAULT_PORT})
  imba-mcp --help                Show this help

Environment (required unless --help):
  IMBA_SUPABASE_URL               (or SUPABASE_URL)
  IMBA_SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_SERVICE_ROLE_KEY)

The service-role key is used server-side only and is never exposed through any
tool argument or response. Exposed tools:
  blog_list_posts, blog_get_post, blog_search_posts, blog_create_post,
  blog_update_post, blog_delete_post, blog_set_published, blog_list_categories
Exposed resources:
  imba://blog/posts            (all posts)
  imba://blog/posts/{slug}     (single post by slug)
`

async function startStdio(): Promise<void> {
  const config = readConfig()
  const db = createServiceClient(config)
  const server = buildMcpServer(db)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stdout is reserved for the protocol; log to stderr.
  process.stderr.write(`${SERVER_NAME}: listening on stdio\n`)
}

async function startHttp(port: number): Promise<void> {
  const config = readConfig()
  const db = createServiceClient(config)
  const server = buildMcpServer(db)

  // Stateful streamable-HTTP: a session id is minted on initialize and echoed
  // back via the Mcp-Session-Id header. A single transport instance is reused
  // for the lifetime of the process.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  })
  await server.connect(transport)

  const http = createServer((req, res) => {
    if (req.url !== '/mcp' && req.url !== '/') {
      res.statusCode = 404
      res.end('Not found. POST MCP requests to /mcp')
      return
    }
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => {
      let body: unknown
      const raw = Buffer.concat(chunks).toString('utf8')
      if (raw.length > 0) {
        try {
          body = JSON.parse(raw)
        } catch {
          res.statusCode = 400
          res.end('Invalid JSON body')
          return
        }
      }
      transport.handleRequest(req, res, body).catch((err) => {
        process.stderr.write(`${SERVER_NAME}: request error: ${String(err)}\n`)
        if (!res.headersSent) {
          res.statusCode = 500
          res.end('Internal server error')
        }
      })
    })
    req.on('error', (err) => {
      process.stderr.write(`${SERVER_NAME}: socket error: ${String(err)}\n`)
    })
  })

  await new Promise<void>((resolve) => http.listen(port, resolve))
  process.stderr.write(`${SERVER_NAME}: listening on http://localhost:${port}/mcp\n`)
}

async function main(): Promise<void> {
  let cli: Cli
  try {
    cli = parseArgs(process.argv.slice(2))
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n\n${USAGE}`)
    process.exit(2)
  }

  if (cli.help) {
    process.stdout.write(USAGE)
    process.exit(0)
  }

  if (cli.http) await startHttp(cli.port)
  else await startStdio()
}

main().catch((err) => {
  process.stderr.write(`${SERVER_NAME}: fatal: ${(err as Error).message}\n`)
  process.exit(1)
})
