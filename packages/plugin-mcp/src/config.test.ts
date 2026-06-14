import { describe, expect, it } from 'vitest'
import { CMS_CAPABILITIES } from '../../core/src/permissions.js'
import { DEFAULT_MCP_CAPABILITIES, readConfig } from './config.js'

const baseEnv = {
  IMBA_SUPABASE_URL: 'https://example.supabase.co',
  IMBA_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
} satisfies Record<string, string>

describe('readConfig', () => {
  it('uses safe defaults for auth mode and capabilities', () => {
    const config = readConfig(baseEnv)
    expect(config.authMode).toBe('none')
    expect(config.allowedCapabilities).toEqual(DEFAULT_MCP_CAPABILITIES)
  })

  it('requires a bearer token when bearer auth is enabled', () => {
    expect(() => readConfig({
      ...baseEnv,
      IMBA_MCP_AUTH_MODE: 'bearer',
    })).toThrow('IMBA_MCP_BEARER_TOKEN')
  })

  it('parses basic auth and allowed capabilities from env', () => {
    const config = readConfig({
      ...baseEnv,
      IMBA_MCP_AUTH_MODE: 'basic',
      IMBA_MCP_BASIC_USERNAME: 'admin',
      IMBA_MCP_BASIC_PASSWORD: 'secret',
      IMBA_MCP_ALLOWED_CAPABILITIES: `${CMS_CAPABILITIES.blogRead}, ${CMS_CAPABILITIES.blogPublish}`,
    })

    expect(config.authMode).toBe('basic')
    expect(config.basicUsername).toBe('admin')
    expect(config.allowedCapabilities).toEqual([
      CMS_CAPABILITIES.blogRead,
      CMS_CAPABILITIES.blogPublish,
    ])
  })
})
