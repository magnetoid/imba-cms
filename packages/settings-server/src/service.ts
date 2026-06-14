import type { SupabaseClient } from '@supabase/supabase-js'
import { CMS_CAPABILITIES, hasCapability } from '@imba/core'
import {
  type ConnectionTestResult,
  DEFAULT_GRAPHQL_SETTINGS,
  DEFAULT_MCP_SETTINGS,
  graphqlSettingsSchema,
  mcpSettingsSchema,
  type GraphqlSettings,
  type McpSettings,
} from '@imba/plugin-settings/src/shared'

const SETTINGS_TABLE = 'cms_private_settings'
const SETTINGS_KEY = 'config'
const GRAPHQL_SCOPES = ['settings.graphql', 'graphql'] as const
const MCP_SCOPES = ['settings.mcp', 'mcp'] as const

type SettingsDb = Pick<SupabaseClient, 'from' | 'auth'>

export interface GraphqlSettingsResponse extends GraphqlSettings {
  hasToken: boolean
  hasPassword: boolean
}

export interface McpSettingsResponse extends McpSettings {
  hasToken: boolean
  hasPassword: boolean
}

function toBasicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function buildAuthHeaders(config: { authMode: GraphqlSettings['authMode'] | McpSettings['authMode']; token?: string; username?: string; password?: string }) {
  if (config.authMode === 'bearer' && config.token) {
    return { Authorization: `Bearer ${config.token}` } satisfies Record<string, string>
  }
  if (config.authMode === 'basic' && config.username && config.password) {
    return { Authorization: toBasicAuthHeader(config.username, config.password) } satisfies Record<string, string>
  }
  return {} as Record<string, string>
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

async function readJsonSafely(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function loadStoredValue<T>(
  db: SettingsDb,
  scopes: readonly string[],
  defaults: T,
): Promise<T> {
  for (const scope of scopes) {
    const result = await db
      .from(SETTINGS_TABLE)
      .select('value')
      .eq('scope', scope)
      .eq('key', SETTINGS_KEY)
      .maybeSingle()

    if (result.error) throw new Error(result.error.message)
    if (result.data?.value && typeof result.data.value === 'object') {
      return { ...defaults, ...result.data.value } as T
    }
  }

  return defaults
}

function redactGraphqlSettings(value: GraphqlSettings): GraphqlSettingsResponse {
  return {
    ...value,
    token: '',
    password: '',
    hasToken: Boolean(value.token),
    hasPassword: Boolean(value.password),
  }
}

function redactMcpSettings(value: McpSettings): McpSettingsResponse {
  return {
    ...value,
    token: '',
    password: '',
    hasToken: Boolean(value.token),
    hasPassword: Boolean(value.password),
  }
}

function mergeGraphqlSecrets(existing: GraphqlSettings, input: GraphqlSettings): GraphqlSettings {
  return graphqlSettingsSchema.parse({
    ...existing,
    ...input,
    token: input.token?.trim() ? input.token : existing.token,
    password: input.password?.trim() ? input.password : existing.password,
  })
}

function mergeMcpSecrets(existing: McpSettings, input: McpSettings): McpSettings {
  return mcpSettingsSchema.parse({
    ...existing,
    ...input,
    token: input.token?.trim() ? input.token : existing.token,
    password: input.password?.trim() ? input.password : existing.password,
  })
}

async function saveScopeValue<T>(db: SettingsDb, scope: string, value: T) {
  const result = await db
    .from(SETTINGS_TABLE)
    .upsert({ scope, key: SETTINGS_KEY, value }, { onConflict: 'scope,key' })

  if (result.error) throw new Error(result.error.message)
}

export async function requireSettingsAccess(db: SettingsDb, accessToken: string) {
  const result = await db.auth.getUser(accessToken)
  if (result.error || !result.data.user) throw new Error('Unauthorized')
  if (!hasCapability(result.data.user as never, CMS_CAPABILITIES.settingsManage)) {
    throw new Error('Forbidden')
  }
  return result.data.user
}

export async function getGraphqlSettings(db: SettingsDb) {
  const stored = await loadStoredValue(db, GRAPHQL_SCOPES, DEFAULT_GRAPHQL_SETTINGS)
  return redactGraphqlSettings(graphqlSettingsSchema.parse(stored))
}

export async function updateGraphqlSettings(db: SettingsDb, input: GraphqlSettings) {
  const existing = graphqlSettingsSchema.parse(await loadStoredValue(db, GRAPHQL_SCOPES, DEFAULT_GRAPHQL_SETTINGS))
  const merged = mergeGraphqlSecrets(existing, input)
  await saveScopeValue(db, GRAPHQL_SCOPES[0], merged)
  return redactGraphqlSettings(merged)
}

export async function getMcpSettings(db: SettingsDb) {
  const stored = await loadStoredValue(db, MCP_SCOPES, DEFAULT_MCP_SETTINGS)
  return redactMcpSettings(mcpSettingsSchema.parse(stored))
}

export async function updateMcpSettings(db: SettingsDb, input: McpSettings) {
  const existing = mcpSettingsSchema.parse(await loadStoredValue(db, MCP_SCOPES, DEFAULT_MCP_SETTINGS))
  const merged = mergeMcpSecrets(existing, input)
  await saveScopeValue(db, MCP_SCOPES[0], merged)
  return redactMcpSettings(merged)
}

export async function testGraphqlSettingsConnection(
  db: SettingsDb,
  input: GraphqlSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectionTestResult> {
  const existing = graphqlSettingsSchema.parse(await loadStoredValue(db, GRAPHQL_SCOPES, DEFAULT_GRAPHQL_SETTINGS))
  const merged = mergeGraphqlSecrets(existing, input)
  if (!merged.enabled) return { ok: true, message: 'GraphQL integration is disabled.' }

  try {
    const response = await fetchWithTimeout(
      merged.endpointUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(merged),
        },
        body: JSON.stringify({ query: 'query { __typename }' }),
      },
      merged.timeoutMs,
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

export async function testMcpSettingsConnection(
  db: SettingsDb,
  input: McpSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectionTestResult> {
  const existing = mcpSettingsSchema.parse(await loadStoredValue(db, MCP_SCOPES, DEFAULT_MCP_SETTINGS))
  const merged = mergeMcpSecrets(existing, input)
  if (!merged.enabled) return { ok: true, message: 'MCP integration is disabled.' }

  try {
    const response = await fetchWithTimeout(
      merged.endpointUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(merged),
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
      merged.timeoutMs,
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
