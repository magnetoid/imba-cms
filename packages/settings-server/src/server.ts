import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { ZodError } from 'zod'
import { CMS_CAPABILITIES } from '@imba/core/node'
import {
  graphqlSettingsSchema,
  mcpSettingsSchema,
} from '@imba/core/node'
import { resolveAllowedOrigin, type SettingsServerConfig } from './config.js'
import {
  getBlogPostBySlug,
  listPublishedBlogPosts,
  previewTokenRequestSchema,
  createPreviewToken,
} from './content.js'
import {
  getPublishedPage,
  getPublishedProject,
  getPublishedSiteSettings,
  listPublishedPages,
  listPublishedProjects,
} from './delivery.js'
import {
  getGraphqlSettings,
  getMcpSettings,
  testGraphqlSettingsConnection,
  testMcpSettingsConnection,
  updateGraphqlSettings,
  updateMcpSettings,
} from './service.js'
import {
  ForbiddenError,
  UnauthorizedError,
  clearServerSubjectCache,
  requireCapabilityAccess,
  requireSettingsAccess,
} from './auth.js'
import {
  LastSuperAdminError,
  inviteRequestSchema,
  inviteUser,
  listUsers,
  setRoleRequestSchema,
  setUserRole,
} from './users.js'

/** Maps an auth failure to its status code; anything else stays a 400/500. */
function authStatus(error: unknown): number | null {
  if (error instanceof UnauthorizedError) return 401
  if (error instanceof ForbiddenError) return 403
  return null
}

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
  config: Pick<SettingsServerConfig, 'corsOrigin' | 'previewTokenSecret' | 'inviteRedirectTo'>,
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

      if (req.method === 'GET') {
        if (pathname === '/api/content/pages') {
          sendJson(res, 200, { items: await listPublishedPages(db) }, corsOrigin)
          return
        }
        if (pathname === '/api/content/projects') {
          sendJson(res, 200, { items: await listPublishedProjects(db) }, corsOrigin)
          return
        }
        if (pathname === '/api/content/site') {
          const item = await getPublishedSiteSettings(db)
          sendJson(res, item ? 200 : 404, item ? { item } : { error: 'Not found' }, corsOrigin)
          return
        }
        const pageMatch = pathname.match(/^\/api\/content\/pages\/([^/]+)$/)
        if (pageMatch) {
          const item = await getPublishedPage(db, decodeURIComponent(pageMatch[1] ?? ''))
          sendJson(res, item ? 200 : 404, item ? { item } : { error: 'Not found' }, corsOrigin)
          return
        }
        const projectMatch = pathname.match(/^\/api\/content\/projects\/([^/]+)$/)
        if (projectMatch) {
          const item = await getPublishedProject(db, decodeURIComponent(projectMatch[1] ?? ''))
          sendJson(res, item ? 200 : 404, item ? { item } : { error: 'Not found' }, corsOrigin)
          return
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      sendJson(res, error instanceof ZodError || /invalid|slug/i.test(message) ? 400 : 500, { error: message }, corsOrigin)
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
        sendJson(res, authStatus(error) ?? 400, { error: message }, corsOrigin)
      }
      return
    }

    if (!token) {
      sendJson(res, 401, { error: 'Missing bearer token.' }, corsOrigin)
      return
    }

    // User management is gated on users.manage (super_admin only), not on
    // settings.manage, so it is checked before the shared settings gate below.
    const roleMatch = pathname.match(/^\/api\/users\/([^/]+)\/role$/)
    if (pathname === '/api/users' || pathname === '/api/users/invite' || roleMatch) {
      try {
        await requireCapabilityAccess(db, token, CMS_CAPABILITIES.usersManage)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unauthorized'
        sendJson(res, authStatus(error) ?? 500, { error: message }, corsOrigin)
        return
      }

      try {
        if (pathname === '/api/users' && req.method === 'GET') {
          sendJson(res, 200, { items: await listUsers(db) }, corsOrigin)
          return
        }
        if (pathname === '/api/users/invite' && req.method === 'POST') {
          const body = inviteRequestSchema.parse(await readJsonBody(req))
          const item = await inviteUser(db, { email: body.email, role: body.role }, { redirectTo: config.inviteRedirectTo })
          sendJson(res, 201, { item }, corsOrigin)
          return
        }
        if (roleMatch && req.method === 'PUT') {
          const userId = decodeURIComponent(roleMatch[1] ?? '')
          const body = setRoleRequestSchema.parse(await readJsonBody(req))
          await setUserRole(db, userId, body.role)
          // The token → subject cache would otherwise keep the old role live
          // for up to its TTL; a role change must take effect on the next call.
          clearServerSubjectCache()
          sendJson(res, 200, { ok: true }, corsOrigin)
          return
        }
        sendJson(res, 405, { error: 'Method not allowed' }, corsOrigin)
      } catch (error) {
        if (error instanceof LastSuperAdminError) {
          sendJson(res, 409, { error: error.message }, corsOrigin)
          return
        }
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = error instanceof ZodError || /invalid|required|must be/i.test(message) ? 400 : 500
        sendJson(res, status, { error: message }, corsOrigin)
      }
      return
    }

    try {
      await requireSettingsAccess(db, token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'
      sendJson(res, authStatus(error) ?? 500, { error: message }, corsOrigin)
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
