import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureUsersClient } from './client'
import { fetchUsers, inviteUser, setUserRole } from './api'

describe('users api client', () => {
  beforeEach(() => {
    configureUsersClient({
      auth: {
        getSession: vi.fn().mockResolvedValue({ access_token: 'token-123', user: { id: '1' } }),
        onChange: vi.fn().mockReturnValue(() => {}),
        signIn: vi.fn(),
        signOut: vi.fn(),
      },
      baseUrl: 'https://cms.example.com/api/users',
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('lists users with the bearer token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: 'u1', email: 'a@x', role: 'editor' }] }), { status: 200 }),
    )
    const users = await fetchUsers()
    expect(users).toEqual([{ id: 'u1', email: 'a@x', role: 'editor' }])
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://cms.example.com/api/users')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123')
  })

  it('PUTs a role change and POSTs an invite', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ item: { id: 'u9', email: 'n@x', role: 'author' } }), { status: 201 }))
    await setUserRole('u1', null)
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://cms.example.com/api/users/u1/role')
    expect(fetchSpy.mock.calls[0]![1]?.body).toBe(JSON.stringify({ role: null }))
    const invited = await inviteUser('n@x', 'author')
    expect(invited.id).toBe('u9')
    expect(fetchSpy.mock.calls[1]![0]).toBe('https://cms.example.com/api/users/invite')
  })

  it('surfaces the server error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Cannot remove the last super_admin' }), { status: 409 }),
    )
    await expect(setUserRole('u1', null)).rejects.toThrow(/last super_admin/)
  })
})
