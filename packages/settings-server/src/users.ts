import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CMS_ROLES, parseCmsRole, type CmsRole } from '@imba/core/node'

/**
 * User and role management.
 *
 * `cms_user_roles` and the `users.manage` capability have existed since core
 * V003/V006, but nothing let anyone assign a role: the table could only be
 * edited from the database console. Listing users at all needs GoTrue's admin
 * API, which is service-role only — so this lives here, behind the bearer +
 * capability gate, and `@imba/plugin-users` talks to it over HTTP.
 */

export type UsersDb = Pick<SupabaseClient, 'from' | 'auth'>

export interface ManagedUser {
  id: string
  email: string | null
  role: CmsRole | null
  createdAt: string | null
  lastSignInAt: string | null
  confirmedAt: string | null
  invitedAt: string | null
}

const ROLE_TABLE = 'cms_user_roles'
const roleSchema = z.string().refine((value) => parseCmsRole(value) !== undefined, {
  message: `role must be one of: ${CMS_ROLES.join(', ')}`,
})

export const setRoleRequestSchema = z.object({
  /** `null` removes the user's CMS access entirely. */
  role: roleSchema.nullable(),
})

export const inviteRequestSchema = z.object({
  email: z.string().trim().email(),
  role: roleSchema,
})

/** Thrown when a change would leave the install with no super_admin. */
export class LastSuperAdminError extends Error {
  constructor() {
    super('Cannot remove the last super_admin: at least one must remain to manage users.')
    this.name = 'LastSuperAdminError'
  }
}

interface AuthAdminUser {
  id: string
  email?: string | null
  created_at?: string | null
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  invited_at?: string | null
}

function toManagedUser(user: AuthAdminUser, role: CmsRole | null): ManagedUser {
  return {
    id: user.id,
    email: user.email ?? null,
    role,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    confirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
    invitedAt: user.invited_at ?? null,
  }
}

async function loadRoleMap(db: UsersDb): Promise<Map<string, CmsRole>> {
  const { data, error } = await db.from(ROLE_TABLE).select('user_id, role')
  if (error) throw new Error(error.message)
  const map = new Map<string, CmsRole>()
  for (const row of (data ?? []) as Array<{ user_id: string; role: string }>) {
    const role = parseCmsRole(row.role)
    if (role) map.set(row.user_id, role)
  }
  return map
}

export async function listUsers(db: UsersDb): Promise<ManagedUser[]> {
  const [{ data, error }, roles] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    loadRoleMap(db),
  ])
  if (error) throw new Error(error.message)
  return (data.users as AuthAdminUser[]).map((user) => toManagedUser(user, roles.get(user.id) ?? null))
}

export async function setUserRole(db: UsersDb, userId: string, role: CmsRole | null): Promise<void> {
  const roles = await loadRoleMap(db)
  const current = roles.get(userId) ?? null

  if (current === 'super_admin' && role !== 'super_admin') {
    const remaining = [...roles.entries()].filter(([id, r]) => id !== userId && r === 'super_admin')
    if (remaining.length === 0) throw new LastSuperAdminError()
  }

  if (role === null) {
    const { error } = await db.from(ROLE_TABLE).delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await db.from(ROLE_TABLE).upsert({ user_id: userId, role })
  if (error) throw new Error(error.message)
}

export async function inviteUser(
  db: UsersDb,
  input: { email: string; role: CmsRole },
  opts: { redirectTo?: string } = {},
): Promise<ManagedUser> {
  const { data, error } = await db.auth.admin.inviteUserByEmail(
    input.email,
    opts.redirectTo ? { redirectTo: opts.redirectTo } : {},
  )
  if (error || !data.user) throw new Error(error?.message ?? 'Invite failed')

  const { error: roleError } = await db.from(ROLE_TABLE).upsert({ user_id: data.user.id, role: input.role })
  if (roleError) throw new Error(roleError.message)

  return toManagedUser(data.user as AuthAdminUser, input.role)
}
