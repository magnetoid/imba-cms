import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { CMS_CAPABILITIES } from '@imba/core'
import {
  graphqlSettingsSchema,
  mcpSettingsSchema,
} from '@imba/plugin-settings/src/shared'
import { resolveAllowedOrigin, type SettingsServerConfig } from './config'
import {
  getBlogPostBySlug,
  listPublishedBlogPosts,
  previewTokenRequestSchema,
  createPreviewToken,
} from './content'
import {
  getGraphqlSettings,
  getMcpSettings,
  requireCapabilityAccess,
  requireSettingsAccess,
  testGraphqlSettingsConnection,
  testMcpSettingsConnection,
  updateGraphqlSettings,
  updateMcpSettings,
} from './service'

type SettingsDb = Parameters<typeof getGraphqlSettings>[0]

/**
 * Emits CORS headers for a single request. When the configured policy is an
 * allowlist rather than `'*'`, the request's own `Origin` is echoed back (and
 * `Vary: Origin` set so caches do not serve one origin's response to another).
 * A disallowed origin gets no header at all, so the browser blocks the read.
 */
function setCors(res: ServerResponse, allowed: string | null) {
  if (allowed) res.setHeader('Access-Control-Allow-Origin', allowed)
  if (allowed !== '*') res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
}

function sendJson(res: ServerResponse, status: number, payload: unknown, allowed: string | null) {
  setCors(res, allowed)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  return JSON.parse(raw) as unknown
}

function bearerToken(req: IncomingMessage) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

export function createSettingsHttpHandler(
  db: SettingsDb,
  config: Pick<SettingsServerConfig, 'corsOrigin' | 'previewTokenSecret'>,
) {
  return async function handler(req: IncomingMessage, res: ServerResponse) {
    // Resolved once per request: an allowlist policy echoes back this request's
    // own Origin, so it cannot be hoisted out of the handler.
    const corsOrigin = resolveAllowedOrigin(config.corsOrigin, req.headers.origin)

    if (!req.url) {
      sendJson(res, 404, { error: 'Not found' }, corsOrigin)
      return
    }

    const requestUrl = new URL(req.url, 'http://localhost')
    const pathname = requestUrl.pathname

    if (req.method === 'OPTIONS') {
      setCors(res, corsOrigin)
      res.statusCode = 204
      res.end()
      return
    }

    if (pathname === '/health' && req.method === 'GET') {
      sendJson(res, 200, { ok: true }, corsOrigin)
      return
    }

    try {
      if (pathname === '/api/content/blog/posts' && req.method === 'GET') {
        sendJson(res, 200, { items: await listPublishedBlogPosts(db) }, corsOrigin)
        return
      }

      const postMatch = pathname.match(/^\/api\/content\/blog\/posts\/([^/]+)$/)
      if (postMatch && req.method === 'GET') {
        const slug = decodeURIComponent(postMatch[1] ?? '')
        const previewToken = requestUrl.searchParams.get('previewToken') ?? undefined
        const item = await getBlogPostBySlug(db, slug, {
          previewToken,
          previewSecret: config.previewTokenSecret,
        })

        if (!item) {
          sendJson(res, 404, { error: 'Not found' }, corsOrigin)
          return
        }

        sendJson(res, 200, { item }, corsOrigin)
        return
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      sendJson(res, /invalid|slug/i.test(message) ? 400 : 500, { error: message }, corsOrigin)
      return
    }

    // NOTE: a `POST /api/webhook/github` endpoint used to live here. It ran
    // `exec('pnpm run build')` on any unauthenticated POST, ahead of the bearer
    // gate below. It was removed rather than hardened: deploying a new release
    // is the job of the tagged release channel driven by `@imba/cli`, and this
    // service must not be able to spawn processes at all. A test in
    // `server.test.ts` asserts no source file here imports Node's process APIs.

    const token = bearerToken(req)

    if (pathname === '/api/content/blog/preview-token' && req.method === 'POST') {
      if (!token) {
        sendJson(res, 401, { error: 'Missing bearer token.' }, corsOrigin)
        return
      }

      if (!config.previewTokenSecret) {
        sendJson(res, 503, { error: 'Preview tokens are not configured.' }, corsOrigin)
        return
      }

      try {
        await requireCapabilityAccess(db, token, CMS_CAPABILITIES.blogRead)
        const body = previewTokenRequestSchema.parse(await readJsonBody(req))
        sendJson(
          res,
          200,
          { token: createPreviewToken(config.previewTokenSecret, body) },
          corsOrigin,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 400
        sendJson(res, status, { error: message }, corsOrigin)
      }
      return
    }

    if (!token) {
      sendJson(res, 401, { error: 'Missing bearer token.' }, corsOrigin)
      return
    }

    try {
      await requireSettingsAccess(db, token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'
      const status = message === 'Forbidden' ? 403 : 401
      sendJson(res, status, { error: message }, corsOrigin)
      return
    }

    try {
      if (pathname === '/api/settings/graphql' && req.method === 'GET') {
        sendJson(res, 200, await getGraphqlSettings(db), corsOrigin)
        return
      }
      if (pathname === '/api/settings/graphql' && req.method === 'PUT') {
        const body = graphqlSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await updateGraphqlSettings(db, body), corsOrigin)
        return
      }
      if (pathname === '/api/settings/graphql/test' && req.method === 'POST') {
        const body = graphqlSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await testGraphqlSettingsConnection(db, body), corsOrigin)
        return
      }
      if (pathname === '/api/settings/mcp' && req.method === 'GET') {
        sendJson(res, 200, await getMcpSettings(db), corsOrigin)
        return
      }
      if (pathname === '/api/settings/mcp' && req.method === 'PUT') {
        const body = mcpSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await updateMcpSettings(db, body), corsOrigin)
        return
      }
      if (pathname === '/api/settings/mcp/test' && req.method === 'POST') {
        const body = mcpSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await testMcpSettingsConnection(db, body), corsOrigin)
        return
      }

      sendJson(res, 404, { error: 'Not found' }, corsOrigin)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      const status = /required|invalid|url|timeout/i.test(message) ? 400 : 500
      sendJson(res, status, { error: message }, corsOrigin)
    }
  }
}

export function startSettingsServer(db: SettingsDb, config: SettingsServerConfig): Promise<Server> {
  const server = createServer(createSettingsHttpHandler(db, config))
  return new Promise<Server>((resolve) => {
    server.listen(config.port, () => resolve(server))
  })
}
