import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureSettingsClient } from './client'
import { fetchGraphqlSettings, runMcpConnectionTest } from './api'

describe('settings api client', () => {
  beforeEach(() => {
    configureSettingsClient({
      auth: {
        getSession: vi.fn().mockResolvedValue({ access_token: 'token-123', user: { id: '1' } }),
        onChange: vi.fn().mockReturnValue(() => {}),
        signIn: vi.fn(),
        signOut: vi.fn(),
      },
      baseUrl: 'https://cms.example.com/api/settings',
    })
  })

  it('sends bearer-authenticated requests to the settings API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        enabled: true,
        endpointUrl: 'https://api.example.com/graphql',
        authMode: 'none',
        token: '',
        username: '',
        password: '',
        timeoutMs: 5000,
        hasToken: false,
        hasPassword: false,
      }), { status: 200 }),
    )

    await fetchGraphqlSettings()

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://cms.example.com/api/settings/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }),
    )

    fetchSpy.mockRestore()
  })

  it('posts MCP connection tests through the API boundary', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, message: 'ok' }), { status: 200 }),
    )

    await runMcpConnectionTest({
      enabled: true,
      endpointUrl: 'https://automation.example.com/mcp',
      authMode: 'none',
      token: '',
      username: '',
      password: '',
      timeoutMs: 5000,
      transport: 'streamable-http',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://cms.example.com/api/settings/mcp/test',
      expect.objectContaining({ method: 'POST' }),
    )

    fetchSpy.mockRestore()
  })
})
