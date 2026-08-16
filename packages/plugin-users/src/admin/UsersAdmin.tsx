import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CMS_ROLES, ROLE_CAPABILITIES, useCmsSession, type CmsRole } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@imba/ui'
import { fetchUsers, inviteUser, setUserRole } from '../api'
import type { ManagedUser } from '../types'

const NO_ROLE = '__none__'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusOf(user: ManagedUser): string {
  if (user.confirmedAt) return user.lastSignInAt ? `Active · last sign-in ${formatDate(user.lastSignInAt)}` : 'Confirmed'
  if (user.invitedAt) return `Invited ${formatDate(user.invitedAt)}`
  return 'Unconfirmed'
}

/**
 * `/admin/users` — assign CMS roles and invite new users.
 *
 * The list, role changes and invites all go through `@imba/settings-server`
 * (service-role) because GoTrue's user directory is not readable from the
 * browser. Gated on `users.manage`, which only super_admin holds.
 */
export default function UsersAdmin() {
  const session = useCmsSession()
  const [users, setUsers] = useState<ManagedUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<CmsRole>('editor')
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const roleDescriptions = useMemo(() => Object.fromEntries(
    CMS_ROLES.map((role) => [role, `${ROLE_CAPABILITIES[role].length} capabilities`]),
  ) as Record<CmsRole, string>, [])

  async function reload() {
    try {
      setUsers(await fetchUsers())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.')
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function changeRole(user: ManagedUser, value: string) {
    const role = value === NO_ROLE ? null : (value as CmsRole)
    setBusyId(user.id)
    setNotice(null)
    try {
      await setUserRole(user.id, role)
      setUsers((current) => current?.map((u) => (u.id === user.id ? { ...u, role } : u)) ?? null)
      setNotice(role ? `${user.email ?? user.id} is now ${role}.` : `${user.email ?? user.id} no longer has CMS access.`)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
    } finally {
      setBusyId(null)
    }
  }

  async function submitInvite(event: FormEvent) {
    event.preventDefault()
    setInviting(true)
    setNotice(null)
    try {
      const created = await inviteUser(inviteEmail.trim(), inviteRole)
      setUsers((current) => [...(current ?? []), created])
      setNotice(`Invitation sent to ${created.email ?? inviteEmail}.`)
      setInviteEmail('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="p-6" data-testid="users-admin">
      <header>
        <h1 className="text-2xl font-semibold">Users &amp; roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who can sign in to the CMS and what each account may do. Roles map to capabilities; the database enforces the same table.
        </p>
      </header>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-primary">{notice}</p>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invite a user</CardTitle>
          <CardDescription>They receive an email link to set a password; the role applies as soon as they sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitInvite} className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[16rem] flex-1 flex-col gap-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="editor@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as CmsRole)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CMS_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={inviting || inviteEmail.trim().length === 0}>
              {inviting ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {users ? `${users.length} account${users.length === 1 ? '' : 's'}` : 'Loading…'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users === null ? (
            <p className="text-sm text-muted-foreground" data-testid="users-loading">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet. Invite the first user above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.id === session?.user.id
                    return (
                      <tr key={user.id} className="border-b border-border last:border-0" data-testid={`user-row-${user.id}`}>
                        <td className="py-3 pr-4">
                          <span className="font-medium">{user.email ?? user.id}</span>
                          {isSelf && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">you</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            aria-label={`Role for ${user.email ?? user.id}`}
                            value={user.role ?? NO_ROLE}
                            disabled={busyId === user.id}
                            onChange={(e) => changeRole(user, e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            title={user.role ? roleDescriptions[user.role] : 'No CMS access'}
                          >
                            <option value={NO_ROLE}>No CMS access</option>
                            {CMS_ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{statusOf(user)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
