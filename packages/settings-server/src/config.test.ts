import { describe, expect, it } from 'vitest'
import { readConfig, readCorsOrigins, resolveAllowedOrigin } from './config'

const REQUIRED = {
  IMBA_SUPABASE_URL: 'https://project.supabase.co',
  IMBA_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
} satisfies NodeJS.ProcessEnv

describe('readCorsOrigins', () => {
  it('refuses to start when the policy is unset', () => {
    // Regression guard: this used to default to '*' on an API that authorizes
    // with bearer tokens, letting any page on the internet read responses.
    expect(() => readCorsOrigins({})).toThrow(/IMBA_SETTINGS_CORS_ORIGIN/)
  })

  it('refuses a bare wildcard without explicit opt-in', () => {
    expect(() => readCorsOrigins({ IMBA_SETTINGS_CORS_ORIGIN: '*' })).toThrow(
      /IMBA_ALLOW_WILDCARD_CORS/,
    )
  })

  it('allows the wildcard when explicitly opted in', () => {
    expect(readCorsOrigins({ IMBA_SETTINGS_CORS_ORIGIN: '*', IMBA_ALLOW_WILDCARD_CORS: '1' })).toBe('*')
    expect(readCorsOrigins({ IMBA_ALLOW_WILDCARD_CORS: '1' })).toBe('*')
  })

  it('parses a comma-separated allowlist', () => {
    expect(
      readCorsOrigins({ IMBA_SETTINGS_CORS_ORIGIN: 'https://a.example, https://b.example' }),
    ).toEqual(['https://a.example', 'https://b.example'])
  })

  it('rejects a value with no usable origins', () => {
    expect(() => readCorsOrigins({ IMBA_SETTINGS_CORS_ORIGIN: ' , , ' })).toThrow(/no origins/)
  })
})

describe('resolveAllowedOrigin', () => {
  it('returns the wildcard as-is', () => {
    expect(resolveAllowedOrigin('*', undefined)).toBe('*')
    expect(resolveAllowedOrigin('*', 'https://anything.example')).toBe('*')
  })

  it('echoes back an allowed origin', () => {
    expect(resolveAllowedOrigin(['https://a.example'], 'https://a.example')).toBe('https://a.example')
  })

  it('returns null for a disallowed origin, so no CORS header is sent', () => {
    expect(resolveAllowedOrigin(['https://a.example'], 'https://evil.example')).toBeNull()
  })

  it('returns null when the request carries no Origin header', () => {
    expect(resolveAllowedOrigin(['https://a.example'], undefined)).toBeNull()
  })
})

describe('readConfig', () => {
  it('reads a complete environment', () => {
    const config = readConfig({
      ...REQUIRED,
      IMBA_SETTINGS_CORS_ORIGIN: 'https://cms.example',
      IMBA_SETTINGS_PORT: '9000',
      IMBA_CONTENT_PREVIEW_SECRET: 'preview-secret',
    })

    expect(config).toEqual({
      supabaseUrl: 'https://project.supabase.co',
      serviceRoleKey: 'service-role-key',
      port: 9000,
      corsOrigin: ['https://cms.example'],
      previewTokenSecret: 'preview-secret',
    })
  })

  it('still requires the Supabase credentials', () => {
    expect(() => readConfig({ IMBA_SETTINGS_CORS_ORIGIN: 'https://cms.example' })).toThrow(
      /IMBA_SUPABASE_URL/,
    )
  })
})
