import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  type ConnectionTestResult,
  DEFAULT_GRAPHQL_SETTINGS,
  DEFAULT_MCP_SETTINGS,
  graphqlSettingsSchema,
  mcpSettingsSchema,
  type AuthMode,
  type GraphqlSettings,
  type McpSettings,
} from './shared'

const SETTINGS_TABLE = 'cms_private_settings'
const SETTINGS_KEY = 'config'

export type SettingsDb = Pick<SupabaseClient, 'from'>

function basicAuthHeader(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`
}

function buildAuthHeaders(config: { authMode: AuthMode; token?: string; username?: string; password?: string }) {
  if (config.authMode === 'bearer' && config.token) {
    return { Authorization: `Bearer ${config.token}` } satisfies Record<string, string>
  }
  if (config.authMode === 'basic' && config.username && config.password) {
    return { Authorization: basicAuthHeader(config.username, config.password) } satisfies Record<string, string>
  }
  return {} as Record<string, string>
}

async function readJsonSafely(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number, fetchImpl: typeof fetch) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function loadPrivateSettings<T>(
  db: SettingsDb,
  scope: string,
  schema: z.ZodType<T>,
  defaults: T,
): Promise<T> {
  const result = await db
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('scope', scope)
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (result.error) throw new Error(result.error.message)
  if (!result.data?.value) return defaults
  return schema.parse({ ...defaults, ...result.data.value })
}

async function savePrivateSettings<T>(
  db: SettingsDb,
  scope: string,
  schema: z.ZodType<T>,
  value: T,
): Promise<T> {
  const parsed = schema.parse(value)
  const result = await db
    .from(SETTINGS_TABLE)
    .upsert({ scope, key: SETTINGS_KEY, value: parsed }, { onConflict: 'scope,key' })

  if (result.error) throw new Error(result.error.message)
  return parsed
}

export async function loadGraphqlSettings(db: SettingsDb) {
  return loadPrivateSettings(db, 'graphql', graphqlSettingsSchema, DEFAULT_GRAPHQL_SETTINGS)
}

export async function saveGraphqlSettings(db: SettingsDb, value: GraphqlSettings) {
  return savePrivateSettings(db, 'graphql', graphqlSettingsSchema, value)
}

export async function loadMcpSettings(db: SettingsDb) {
  return loadPrivateSettings(db, 'mcp', mcpSettingsSchema, DEFAULT_MCP_SETTINGS)
}

export async function saveMcpSettings(db: SettingsDb, value: McpSettings) {
  return savePrivateSettings(db, 'mcp', mcpSettingsSchema, value)
}

export async function testGraphqlConnection(
  rawConfig: GraphqlSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectionTestResult> {
  const config = graphqlSettingsSchema.parse(rawConfig)
  if (!config.enabled) return { ok: true, message: 'GraphQL integration is disabled.' }

  try {
    const response = await fetchWithTimeout(
      config.endpointUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(config),
        },
        body: JSON.stringify({ query: 'query { __typename }' }),
      },
      config.timeoutMs,
      fetchImpl,
    )

    const payload = await readJsonSafely(response)
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: payload && typeof payload === 'object' ? 'GraphQL endpoint rejected the request.' : response.statusText,
      }
    }

    if (payload && typeof payload === 'object' && ('data' in payload || 'errors' in payload)) {
      return { ok: true, status: response.status, message: 'GraphQL endpoint responded successfully.' }
    }

    return { ok: false, status: response.status, message: 'Endpoint responded, but it did not look like GraphQL.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Connection test failed.' }
  }
}

export async function testMcpConnection(
  rawConfig: McpSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectionTestResult> {
  const config = mcpSettingsSchema.parse(rawConfig)
  if (!config.enabled) return { ok: true, message: 'MCP integration is disabled.' }

  try {
    const response = await fetchWithTimeout(
      config.endpointUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(config),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'settings-connection-test',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'imba-cms', version: '0.1.0' },
          },
        }),
      },
      config.timeoutMs,
      fetchImpl,
    )

    if (response.status < 500) {
      return { ok: true, status: response.status, message: 'MCP server responded successfully.' }
    }

    return { ok: false, status: response.status, message: 'MCP server is reachable but returned a server error.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Connection test failed.' }
  }
}
