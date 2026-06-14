import { describe, expect, it, vi } from 'vitest'
import {
  loadGraphqlSettings,
  saveGraphqlSettings,
  testGraphqlConnection,
  testMcpConnection,
} from './service'
import { DEFAULT_GRAPHQL_SETTINGS, DEFAULT_MCP_SETTINGS } from './shared'

function makeDb(value?: unknown) {
  const state = { upsertPayload: null as unknown }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: value ? { value } : null, error: null }),
    upsert: vi.fn().mockImplementation((payload: unknown) => {
      state.upsertPayload = payload
      return Promise.resolve({ error: null })
    }),
  }

  return {
    db: { from: vi.fn().mockReturnValue(chain) },
    chain,
    state,
  }
}

describe('settings service', () => {
  it('loads default GraphQL settings when nothing is stored yet', async () => {
    const { db } = makeDb()
    await expect(loadGraphqlSettings(db as never)).resolves.toEqual(DEFAULT_GRAPHQL_SETTINGS)
  })

  it('persists GraphQL settings in private settings storage', async () => {
    const { db, state } = makeDb()
    const value = {
      ...DEFAULT_GRAPHQL_SETTINGS,
      enabled: true,
      endpointUrl: 'https://api.example.com/graphql',
      authMode: 'bearer' as const,
      token: 'secret',
    }

    await expect(saveGraphqlSettings(db as never, value)).resolves.toEqual(value)
    expect(state.upsertPayload).toEqual({
      scope: 'graphql',
      key: 'config',
      value,
    })
  })

  it('tests GraphQL connections via HTTP POST', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { __typename: 'Query' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await testGraphqlConnection({
      ...DEFAULT_GRAPHQL_SETTINGS,
      enabled: true,
      endpointUrl: 'https://api.example.com/graphql',
    }, fetchImpl)

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('tests MCP connections against the configured endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))

    const result = await testMcpConnection({
      ...DEFAULT_MCP_SETTINGS,
      enabled: true,
      endpointUrl: 'https://automation.example.com/mcp',
    }, fetchImpl)

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
