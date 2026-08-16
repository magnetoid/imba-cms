import { createClient } from '@supabase/supabase-js'

/**
 * `'*'` means "any origin". Anything else is an explicit allowlist that the
 * request's `Origin` header is matched against.
 */
export type CorsOrigins = '*' | readonly string[]

export interface SettingsServerConfig {
  supabaseUrl: string
  serviceRoleKey: string
  port: number
  corsOrigin: CorsOrigins
  previewTokenSecret?: string
  /** Where GoTrue sends an invited user after they accept (the admin URL). */
  inviteRedirectTo?: string
}

function readRequired(env: NodeJS.ProcessEnv, name: string, fallback?: string) {
  const value = env[name] ?? (fallback ? env[fallback] : undefined)
  if (!value) throw new Error(`Missing required environment variable: ${name}${fallback ? ` (or ${fallback})` : ''}`)
  return value
}

/**
 * Resolves the CORS policy.
 *
 * This used to default to `'*'`, which is unsound on an API that authorizes with
 * bearer tokens: any page on the internet could read responses on a user's
 * behalf. The wildcard is still reachable, but only by asking for it explicitly.
 */
export function readCorsOrigins(env: NodeJS.ProcessEnv): CorsOrigins {
  const raw = env.IMBA_SETTINGS_CORS_ORIGIN?.trim()

  if (!raw) {
    if (env.IMBA_ALLOW_WILDCARD_CORS === '1') return '*'
    throw new Error(
      'Missing required environment variable: IMBA_SETTINGS_CORS_ORIGIN. ' +
        'Set it to a comma-separated list of allowed origins (for example ' +
        '"https://cms.example.com,https://example.com"), or set ' +
        'IMBA_ALLOW_WILDCARD_CORS=1 to explicitly allow any origin.',
    )
  }

  if (raw === '*') {
    if (env.IMBA_ALLOW_WILDCARD_CORS === '1') return '*'
    throw new Error(
      'IMBA_SETTINGS_CORS_ORIGIN="*" allows any site to read authenticated ' +
        'responses from this API. Set IMBA_ALLOW_WILDCARD_CORS=1 to confirm ' +
        'that is intended, or list the allowed origins explicitly.',
    )
  }

  const origins = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  if (origins.length === 0) {
    throw new Error('IMBA_SETTINGS_CORS_ORIGIN was set but contained no origins.')
  }

  return origins
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): SettingsServerConfig {
  return {
    supabaseUrl: readRequired(env, 'IMBA_SUPABASE_URL', 'SUPABASE_URL'),
    serviceRoleKey: readRequired(env, 'IMBA_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    port: Number(env.IMBA_SETTINGS_PORT ?? '8790'),
    corsOrigin: readCorsOrigins(env),
    previewTokenSecret: env.IMBA_CONTENT_PREVIEW_SECRET,
    inviteRedirectTo: env.IMBA_INVITE_REDIRECT_URL?.trim() || undefined,
  }
}

/**
 * Resolves the `Access-Control-Allow-Origin` value for one request, or `null`
 * when the origin is not allowed (in which case no CORS header is sent and the
 * browser blocks the response).
 */
export function resolveAllowedOrigin(
  allowed: CorsOrigins,
  requestOrigin: string | undefined,
): string | null {
  if (allowed === '*') return '*'
  if (!requestOrigin) return null
  return allowed.includes(requestOrigin) ? requestOrigin : null
}

export function createServiceClient(config: SettingsServerConfig) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
