import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolved server configuration. The service-role key has full DB access and
 * must only ever live here (server-side, from env) — never in a tool argument
 * or response.
 */
export interface McpConfig {
  supabaseUrl: string
  serviceRoleKey: string
}

function pickEnv(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]
    if (value && value.trim().length > 0) return value.trim()
  }
  return undefined
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

  const missing: string[] = []
  if (!supabaseUrl) missing.push('IMBA_SUPABASE_URL (or SUPABASE_URL)')
  if (!serviceRoleKey) missing.push('IMBA_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)')

  if (missing.length > 0) {
    throw new Error(
      `@imba/plugin-mcp: missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them before starting the server.`,
    )
  }

  return { supabaseUrl: supabaseUrl!, serviceRoleKey: serviceRoleKey! }
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
