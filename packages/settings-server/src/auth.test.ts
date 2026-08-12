import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CMS_CAPABILITIES } from '@imba/core'
import {
  ForbiddenError,
  UnauthorizedError,
  clearServerSubjectCache,
  requireAnyCapability,
  requireCapabilityAccess,
  requireSettingsAccess,
  resolveServerCapabilities,
  resolveServerSubject,
} from './auth'

interface FakeDbOptions {
  role?: string | null
  userError?: boolean
  roleError?: string
}

function makeDb({ role = null, userError = false, roleError }: FakeDbOptions = {}) {
  const maybeSingle = vi.fn().mockResolvedValue(
    roleError
      ? { data: null, error: { message: roleError } }
      : { data: role === null ? null : { role }, error: null },
  )
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  const getUser = vi.fn().mockResolvedValue(
    userError
      ? { data: { user: null }, error: { message: 'bad jwt' } }
      : {
          // Deliberately the exact shape GoTrue returns: `role: 'authenticated'`,
          // and app_metadata carrying only provider fields.
          data: {
            user: {
              id: 'user-1',
              email: 'someone@example.com',
              role: 'authenticated',
              app_metadata: { provider: 'email', providers: ['email'] },
            },
          },
          error: null,
        },
  )

  return { db: { from, auth: { getUser } } as never, from, select, eq, maybeSingle, getUser }
}

beforeEach(() => {
  clearServerSubjectCache()
})

describe('resolveServerSubject', () => {
  it('resolves capabilities from the cms_user_roles row', async () => {
    // The regression: a bare GoTrue user has no cms_role and no permissions
    // array, so passing it straight to hasCapability yielded an empty set and
    // 403'd every real user. The role must be looked up and assembled in.
    const { db } = makeDb({ role: 'super_admin' })
    const subject = await resolveServerSubject(db, 'token')

    expect(subject.cms_role).toBe('super_admin')
    expect(subject.capabilities.has(CMS_CAPABILITIES.settingsManage)).toBe(true)
  })

  it('queries cms_user_roles for the authenticated user id', async () => {
    const { db, from, eq } = makeDb({ role: 'editor' })
    await resolveServerSubject(db, 'token')

    expect(from).toHaveBeenCalledWith('cms_user_roles')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('gives a content_admin content capabilities but not settings', async () => {
    const { db } = makeDb({ role: 'content_admin' })
    const capabilities = await resolveServerCapabilities(db, 'token')

    expect(capabilities.has(CMS_CAPABILITIES.blogWrite)).toBe(true)
    expect(capabilities.has(CMS_CAPABILITIES.settingsManage)).toBe(false)
  })

  it('resolves the empty set for a user with no role row', async () => {
    const { db } = makeDb({ role: null })
    const subject = await resolveServerSubject(db, 'token')

    expect(subject.cms_role).toBeUndefined()
    expect(subject.capabilities.size).toBe(0)
  })

  it('ignores an unrecognised role value', async () => {
    const { db } = makeDb({ role: 'wizard' })
    const subject = await resolveServerSubject(db, 'token')

    expect(subject.cms_role).toBeUndefined()
    expect(subject.capabilities.size).toBe(0)
  })

  it('throws Unauthorized when GoTrue rejects the token', async () => {
    const { db } = makeDb({ userError: true })
    await expect(resolveServerSubject(db, 'token')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws Unauthorized for an empty token without calling GoTrue', async () => {
    const { db, getUser } = makeDb()
    await expect(resolveServerSubject(db, '  ')).rejects.toBeInstanceOf(UnauthorizedError)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('propagates a role-lookup failure rather than denying silently', async () => {
    // A transient DB fault must not read as "this user has no capabilities".
    const { db } = makeDb({ roleError: 'connection reset' })
    await expect(resolveServerSubject(db, 'token')).rejects.toThrow(/Failed to resolve CMS role/)
  })
})

describe('subject cache', () => {
  it('reuses a resolved subject within the TTL', async () => {
    const { db, getUser } = makeDb({ role: 'editor' })
    await resolveServerSubject(db, 'token', 1_000)
    await resolveServerSubject(db, 'token', 5_000)

    expect(getUser).toHaveBeenCalledTimes(1)
  })

  it('re-resolves once the entry expires', async () => {
    const { db, getUser } = makeDb({ role: 'editor' })
    await resolveServerSubject(db, 'token', 1_000)
    await resolveServerSubject(db, 'token', 1_000 + 30_001)

    expect(getUser).toHaveBeenCalledTimes(2)
  })

  it('does not share entries between tokens', async () => {
    const { db, getUser } = makeDb({ role: 'editor' })
    await resolveServerSubject(db, 'token-a', 1_000)
    await resolveServerSubject(db, 'token-b', 1_000)

    expect(getUser).toHaveBeenCalledTimes(2)
  })
})

describe('requireCapabilityAccess', () => {
  it('allows a super_admin through the settings gate', async () => {
    const { db } = makeDb({ role: 'super_admin' })
    await expect(requireSettingsAccess(db, 'token')).resolves.toMatchObject({
      cms_role: 'super_admin',
    })
  })

  it('rejects an author at the settings gate', async () => {
    const { db } = makeDb({ role: 'author' })
    await expect(requireSettingsAccess(db, 'token')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('rejects an unroled user at the settings gate', async () => {
    const { db } = makeDb({ role: null })
    await expect(requireSettingsAccess(db, 'token')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('reports which capabilities were missing', async () => {
    const { db } = makeDb({ role: 'author' })
    const error = await requireCapabilityAccess(
      db,
      'token',
      CMS_CAPABILITIES.blogRead,
      CMS_CAPABILITIES.settingsManage,
    ).catch((e) => e as ForbiddenError)

    expect(error).toBeInstanceOf(ForbiddenError)
    expect(error.required).toEqual([CMS_CAPABILITIES.settingsManage])
  })

  it('lets an editor mint a preview token (blog.read)', async () => {
    const { db } = makeDb({ role: 'editor' })
    await expect(
      requireCapabilityAccess(db, 'token', CMS_CAPABILITIES.blogRead),
    ).resolves.toMatchObject({ cms_role: 'editor' })
  })
})

describe('requireAnyCapability', () => {
  it('passes when one of the listed capabilities is held', async () => {
    const { db } = makeDb({ role: 'media_manager' })
    await expect(
      requireAnyCapability(db, 'token', [CMS_CAPABILITIES.blogWrite, CMS_CAPABILITIES.mediaWrite]),
    ).resolves.toBeDefined()
  })

  it('rejects when none are held', async () => {
    const { db } = makeDb({ role: 'media_manager' })
    await expect(
      requireAnyCapability(db, 'token', [CMS_CAPABILITIES.blogWrite, CMS_CAPABILITIES.settingsManage]),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
})
