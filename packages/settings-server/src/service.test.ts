import { describe, expect, it, vi } from 'vitest'
import {
  getGraphqlSettings,
  requireSettingsAccess,
  testGraphqlSettingsConnection,
  updateGraphqlSettings,
  updateMcpSettings,
} from './service'

function makeDb(initial: Record<string, unknown> = {}) {
  const store = new Map(Object.entries(initial))
  let activeScope = ''
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((field: string, value: string) => {
      if (field === 'scope') activeScope = value
      return chain
    }),
    maybeSingle: vi.fn().mockImplementation(async () => ({
      data: store.has(activeScope) ? { value: store.get(activeScope) } : null,
      error: null,
    })),
    upsert: vi.fn().mockImplementation(async (payload: { scope: string; value: unknown }) => {
      store.set(payload.scope, payload.value)
      return { error: null }
    }),
  }

  return {
    db: {
      from: vi.fn().mockReturnValue(chain),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1', app_metadata: { is_admin: true } } }, error: null }),
      },
    },
    store,
  }
}

describe('settings server service', () => {
  it('redacts secrets when loading GraphQL settings', async () => {
    const { db } = makeDb({
      'settings.graphql': {
        enabled: true,
        endpointUrl: 'https://api.example.com/graphql',
        authMode: 'bearer',
        token: 'secret',
        username: '',
        password: '',
        timeoutMs: 5000,
      },
    })

    const result = await getGraphqlSettings(db as never)
    expect(result.hasToken).toBe(true)
    expect(result.token).toBe('')
  })

  it('preserves existing GraphQL token when a new save omits it', async () => {
    const { db, store } = makeDb({
      'settings.graphql': {
        enabled: true,
        endpointUrl: 'https://api.example.com/graphql',
        authMode: 'bearer',
        token: 'secret',
        username: '',
        password: '',
        timeoutMs: 5000,
      },
    })

    await updateGraphqlSettings(db as never, {
      enabled: true,
      endpointUrl: 'https://api.changed.com/graphql',
      authMode: 'bearer',
      token: '',
      username: '',
      password: '',
      timeoutMs: 4000,
    })

    expect((store.get('settings.graphql') as { token: string }).token).toBe('secret')
  })

  it('preserves existing MCP password when a new save omits it', async () => {
    const { db, store } = makeDb({
      'settings.mcp': {
        enabled: true,
        endpointUrl: 'https://automation.example.com/mcp',
        authMode: 'basic',
        token: '',
        username: 'admin',
        password: 'secret-pass',
        timeoutMs: 5000,
        transport: 'streamable-http',
      },
    })

    await updateMcpSettings(db as never, {
      enabled: true,
      endpointUrl: 'https://automation.changed.com/mcp',
      authMode: 'basic',
      token: '',
      username: 'admin',
      password: '',
      timeoutMs: 4000,
      transport: 'streamable-http',
    })

    expect((store.get('settings.mcp') as { password: string }).password).toBe('secret-pass')
  })

  it('runs GraphQL connection tests on the server side using stored secrets', async () => {
    const { db } = makeDb({
      'settings.graphql': {
        enabled: true,
        endpointUrl: 'https://api.example.com/graphql',
        authMode: 'bearer',
        token: 'secret',
        username: '',
        password: '',
        timeoutMs: 5000,
      },
    })
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { __typename: 'Query' } }), { status: 200 }),
    )

    const result = await testGraphqlSettingsConnection(db as never, {
      enabled: true,
      endpointUrl: 'https://api.example.com/graphql',
      authMode: 'bearer',
      token: '',
      username: '',
      password: '',
      timeoutMs: 5000,
    }, fetchImpl)

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer secret' })
  })

  it('requires the settings capability for settings access', async () => {
    const { db } = makeDb()
    db.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: '1', app_metadata: { permissions: ['blog.read'] } } },
      error: null,
    })

    await expect(requireSettingsAccess(db as never, 'token')).rejects.toThrow('Forbidden')
  })
})
