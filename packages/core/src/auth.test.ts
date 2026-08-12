import { describe, it, expect, vi } from 'vitest'
import { createAuth } from './auth'

function fakeClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'super_admin' } }),
        }),
      }),
    }),
  }
}

describe('createAuth', () => {
  it('getSession returns the underlying session', async () => {
    const auth = createAuth(fakeClient() as never)
    await expect(auth.getSession()).resolves.toEqual({ user: { id: '1' }, cms_role: 'super_admin' })
  })

  it('signIn maps a successful result to { error: null }', async () => {
    const auth = createAuth(fakeClient() as never)
    await expect(auth.signIn('a@b.com', 'pw')).resolves.toEqual({ error: null })
  })

  it('maps malformed sessions to null', async () => {
    const client = {
      auth: {
        ...fakeClient().auth,
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }),
      },
      from: fakeClient().from,
    }
    const auth = createAuth(client as never)
    await expect(auth.getSession()).resolves.toBeNull()
  })

  it('onChange wires the subscription and returns an unsubscribe fn', () => {
    const client = fakeClient()
    const auth = createAuth(client as never)
    const off = auth.onChange(() => {})
    expect(typeof off).toBe('function')
  })
})
