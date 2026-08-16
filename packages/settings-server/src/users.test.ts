import { describe, expect, it, vi } from 'vitest'
import { inviteUser, listUsers, setUserRole, LastSuperAdminError } from './users.js'

interface RoleRow { user_id: string; role: string }

/**
 * A minimal fake of the two Supabase surfaces the users service touches:
 * `auth.admin` (GoTrue's admin API, service-role only) and `cms_user_roles`.
 */
function makeDb(seed: { users: Array<{ id: string; email: string }>; roles: RoleRow[] }) {
  const roles = [...seed.roles]
  const users = seed.users.map((u) => ({
    ...u,
    created_at: '2026-01-01T00:00:00Z',
    last_sign_in_at: null,
    email_confirmed_at: '2026-01-02T00:00:00Z',
    invited_at: null,
  }))

  const roleTable = () => {
    let pendingDeleteId: string | null = null
    const chain = {
      select: vi.fn(async () => ({ data: roles.map((r) => ({ ...r })), error: null })),
      upsert: vi.fn(async (row: RoleRow) => {
        const idx = roles.findIndex((r) => r.user_id === row.user_id)
        if (idx >= 0) roles[idx] = { ...row }
        else roles.push({ ...row })
        return { error: null }
      }),
      delete: vi.fn(() => ({
        eq: vi.fn(async (_col: string, id: string) => {
          pendingDeleteId = id
          const idx = roles.findIndex((r) => r.user_id === pendingDeleteId)
          if (idx >= 0) roles.splice(idx, 1)
          return { error: null }
        }),
      })),
    }
    return chain
  }

  const db = {
    from: vi.fn((table: string) => {
      if (table !== 'cms_user_roles') throw new Error(`unexpected table ${table}`)
      return roleTable()
    }),
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({ data: { users }, error: null })),
        inviteUserByEmail: vi.fn(async (email: string) => {
          const user = { id: `invited-${email}`, email, created_at: '2026-02-01T00:00:00Z', last_sign_in_at: null, email_confirmed_at: null, invited_at: '2026-02-01T00:00:00Z' }
          users.push(user)
          return { data: { user }, error: null }
        }),
      },
    },
  }
  return { db, roles, users }
}

describe('users service', () => {
  it('lists every auth user with their CMS role (or none)', async () => {
    const { db } = makeDb({
      users: [{ id: 'u1', email: 'root@example.com' }, { id: 'u2', email: 'writer@example.com' }, { id: 'u3', email: 'nobody@example.com' }],
      roles: [{ user_id: 'u1', role: 'super_admin' }, { user_id: 'u2', role: 'author' }],
    })
    const list = await listUsers(db as never)
    expect(list.map((u) => [u.email, u.role])).toEqual([
      ['root@example.com', 'super_admin'],
      ['writer@example.com', 'author'],
      ['nobody@example.com', null],
    ])
    expect(list[0]).toMatchObject({ id: 'u1', createdAt: '2026-01-01T00:00:00Z', confirmedAt: '2026-01-02T00:00:00Z' })
  })

  it('assigns and changes a role', async () => {
    const { db, roles } = makeDb({ users: [{ id: 'u1', email: 'a@x' }, { id: 'u2', email: 'b@x' }], roles: [{ user_id: 'u1', role: 'super_admin' }] })
    await setUserRole(db as never, 'u2', 'editor')
    expect(roles).toContainEqual({ user_id: 'u2', role: 'editor' })
    await setUserRole(db as never, 'u2', 'reviewer')
    expect(roles.find((r) => r.user_id === 'u2')?.role).toBe('reviewer')
  })

  it('removes a role when given null', async () => {
    const { db, roles } = makeDb({ users: [{ id: 'u1', email: 'a@x' }, { id: 'u2', email: 'b@x' }], roles: [{ user_id: 'u1', role: 'super_admin' }, { user_id: 'u2', role: 'author' }] })
    await setUserRole(db as never, 'u2', null)
    expect(roles.map((r) => r.user_id)).toEqual(['u1'])
  })

  it('refuses to demote or remove the last super_admin, which would lock everyone out', async () => {
    const { db, roles } = makeDb({ users: [{ id: 'u1', email: 'a@x' }], roles: [{ user_id: 'u1', role: 'super_admin' }] })
    await expect(setUserRole(db as never, 'u1', 'editor')).rejects.toBeInstanceOf(LastSuperAdminError)
    await expect(setUserRole(db as never, 'u1', null)).rejects.toBeInstanceOf(LastSuperAdminError)
    expect(roles).toEqual([{ user_id: 'u1', role: 'super_admin' }])
  })

  it('allows demoting a super_admin when another remains', async () => {
    const { db, roles } = makeDb({ users: [], roles: [{ user_id: 'u1', role: 'super_admin' }, { user_id: 'u2', role: 'super_admin' }] })
    await setUserRole(db as never, 'u1', 'editor')
    expect(roles.find((r) => r.user_id === 'u1')?.role).toBe('editor')
  })

  it('invites a user by email and records the role in one step', async () => {
    const { db, roles } = makeDb({ users: [], roles: [] })
    const user = await inviteUser(db as never, { email: 'new@example.com', role: 'author' }, { redirectTo: 'https://cms.example.com/admin' })
    expect(db.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('new@example.com', { redirectTo: 'https://cms.example.com/admin' })
    expect(user).toMatchObject({ email: 'new@example.com', role: 'author', invitedAt: '2026-02-01T00:00:00Z' })
    expect(roles).toContainEqual({ user_id: user.id, role: 'author' })
  })
})
