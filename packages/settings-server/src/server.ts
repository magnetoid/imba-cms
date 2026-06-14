import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import {
  graphqlSettingsSchema,
  mcpSettingsSchema,
} from '@imba/plugin-settings/src/shared'
import type { SettingsServerConfig } from './config'
import {
  getGraphqlSettings,
  getMcpSettings,
  requireSettingsAccess,
  testGraphqlSettingsConnection,
  testMcpSettingsConnection,
  updateGraphqlSettings,
  updateMcpSettings,
} from './service'

type SettingsDb = Parameters<typeof getGraphqlSettings>[0]

function setCors(res: ServerResponse, corsOrigin: string) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
}

function sendJson(res: ServerResponse, status: number, payload: unknown, corsOrigin: string) {
  setCors(res, corsOrigin)
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

export function createSettingsHttpHandler(db: SettingsDb, config: Pick<SettingsServerConfig, 'corsOrigin'>) {
  return async function handler(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) {
      sendJson(res, 404, { error: 'Not found' }, config.corsOrigin)
      return
    }

    if (req.method === 'OPTIONS') {
      setCors(res, config.corsOrigin)
      res.statusCode = 204
      res.end()
      return
    }

    if (req.url === '/health' && req.method === 'GET') {
      sendJson(res, 200, { ok: true }, config.corsOrigin)
      return
    }

    const token = bearerToken(req)
    if (!token) {
      sendJson(res, 401, { error: 'Missing bearer token.' }, config.corsOrigin)
      return
    }

    try {
      await requireSettingsAccess(db, token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'
      const status = message === 'Forbidden' ? 403 : 401
      sendJson(res, status, { error: message }, config.corsOrigin)
      return
    }

    try {
      if (req.url === '/api/settings/graphql' && req.method === 'GET') {
        sendJson(res, 200, await getGraphqlSettings(db), config.corsOrigin)
        return
      }
      if (req.url === '/api/settings/graphql' && req.method === 'PUT') {
        const body = graphqlSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await updateGraphqlSettings(db, body), config.corsOrigin)
        return
      }
      if (req.url === '/api/settings/graphql/test' && req.method === 'POST') {
        const body = graphqlSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await testGraphqlSettingsConnection(db, body), config.corsOrigin)
        return
      }
      if (req.url === '/api/settings/mcp' && req.method === 'GET') {
        sendJson(res, 200, await getMcpSettings(db), config.corsOrigin)
        return
      }
      if (req.url === '/api/settings/mcp' && req.method === 'PUT') {
        const body = mcpSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await updateMcpSettings(db, body), config.corsOrigin)
        return
      }
      if (req.url === '/api/settings/mcp/test' && req.method === 'POST') {
        const body = mcpSettingsSchema.parse(await readJsonBody(req))
        sendJson(res, 200, await testMcpSettingsConnection(db, body), config.corsOrigin)
        return
      }

      sendJson(res, 404, { error: 'Not found' }, config.corsOrigin)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      const status = /required|invalid|url|timeout/i.test(message) ? 400 : 500
      sendJson(res, status, { error: message }, config.corsOrigin)
    }
  }
}

export function startSettingsServer(db: SettingsDb, config: SettingsServerConfig): Promise<Server> {
  const server = createServer(createSettingsHttpHandler(db, config))
  return new Promise<Server>((resolve) => {
    server.listen(config.port, () => resolve(server))
  })
}
