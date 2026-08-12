import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CMS_CAPABILITIES } from '@imba/core/node'
import type { CmsCapability } from '@imba/core/node'

const MCP_AUTH_MODES = ['none', 'bearer', 'basic'] as const
export type McpAuthMode = typeof MCP_AUTH_MODES[number]

export const DEFAULT_MCP_CAPABILITIES = [
  CMS_CAPABILITIES.blogRead,
  CMS_CAPABILITIES.blogWrite,
  CMS_CAPABILITIES.blogPublish,
  CMS_CAPABILITIES.blogDelete,
] as const satisfies readonly CmsCapability[]

/**
 * Resolved server configuration. The service-role key has full DB access and
 * must only ever live here (server-side, from env) — never in a tool argument
 * or response.
 */
export interface McpConfig {
  supabaseUrl: string
  serviceRoleKey: string
  authMode: McpAuthMode
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  allowedCapabilities: readonly CmsCapability[]
  /** Set by `IMBA_MCP_ALLOW_INSECURE=1`. Only consulted by the HTTP transport. */
  allowInsecureHttp: boolean
}

function pickEnv(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]
    if (value && value.trim().length > 0) return value.trim()
  }
  return undefined
}

function parseAuthMode(value: string | undefined): McpAuthMode {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return 'none'
  if (MCP_AUTH_MODES.includes(normalized as McpAuthMode)) {
    return normalized as McpAuthMode
  }
  throw new Error(
    `@imba/plugin-mcp: invalid IMBA_MCP_AUTH_MODE "${value}". ` +
      `Expected one of: ${MCP_AUTH_MODES.join(', ')}.`,
  )
}

function parseCapabilities(value: string | undefined): readonly CmsCapability[] {
  if (!value) return DEFAULT_MCP_CAPABILITIES

  const capabilities = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is CmsCapability => entry.length > 0)

  return capabilities.length > 0 ? capabilities : DEFAULT_MCP_CAPABILITIES
}

/**
 * Reads the Supabase connection config from the environment.
 *
 * - URL: `IMBA_SUPABASE_URL` or `SUPABASE_URL`
 * - Service-role key: `IMBA_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
 *
 * Throws a clear error listing the missing variable(s) so misconfiguration is
 * obvious at startup.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const supabaseUrl = pickEnv(env, 'IMBA_SUPABASE_URL', 'SUPABASE_URL')
  const serviceRoleKey = pickEnv(env, 'IMBA_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
  const authMode = parseAuthMode(pickEnv(env, 'IMBA_MCP_AUTH_MODE'))
  const bearerToken = pickEnv(env, 'IMBA_MCP_BEARER_TOKEN')
  const basicUsername = pickEnv(env, 'IMBA_MCP_BASIC_USERNAME')
  const basicPassword = pickEnv(env, 'IMBA_MCP_BASIC_PASSWORD')
  const allowedCapabilities = parseCapabilities(pickEnv(env, 'IMBA_MCP_ALLOWED_CAPABILITIES'))
  const allowInsecureHttp = pickEnv(env, 'IMBA_MCP_ALLOW_INSECURE') === '1'

  const missing: string[] = []
  if (!supabaseUrl) missing.push('IMBA_SUPABASE_URL (or SUPABASE_URL)')
  if (!serviceRoleKey) missing.push('IMBA_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)')
  if (authMode === 'bearer' && !bearerToken) missing.push('IMBA_MCP_BEARER_TOKEN')
  if (authMode === 'basic' && !basicUsername) missing.push('IMBA_MCP_BASIC_USERNAME')
  if (authMode === 'basic' && !basicPassword) missing.push('IMBA_MCP_BASIC_PASSWORD')

  if (missing.length > 0) {
    throw new Error(
      `@imba/plugin-mcp: missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them before starting the server.`,
    )
  }

  return {
    supabaseUrl: supabaseUrl!,
    serviceRoleKey: serviceRoleKey!,
    authMode,
    bearerToken,
    basicUsername,
    basicPassword,
    allowedCapabilities,
    allowInsecureHttp,
  }
}

/**
 * Guards the HTTP transport against being exposed unauthenticated.
 *
 * `authMode: 'none'` is the correct default for the **stdio** transport: the
 * process is spawned by the local agent, speaks over a pipe, and opens no
 * socket. It is not safe for `--http`, which binds a listener in front of a
 * service-role key. So the requirement lives here, at the transport boundary,
 * rather than in `readConfig` — gating it there would break every local
 * `claude mcp add` install.
 */
export function assertHttpAuthConfigured(config: McpConfig): void {
  if (config.authMode !== 'none') return
  if (config.allowInsecureHttp) return

  throw new Error(
    '@imba/plugin-mcp: refusing to start an unauthenticated HTTP server. ' +
      'This process holds the Supabase service-role key. Set IMBA_MCP_AUTH_MODE to ' +
      '"bearer" or "basic" (with the matching token/credentials), or set ' +
      'IMBA_MCP_ALLOW_INSECURE=1 if the listener is genuinely unreachable from ' +
      'outside the host. The stdio transport is unaffected.',
  )
}

/**
 * Creates a Supabase client authenticated with the service-role key. Session
 * persistence is disabled because this is a stateless server process, not a
 * browser/user session.
 */
export function createServiceClient(config: McpConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false },
  })
}
