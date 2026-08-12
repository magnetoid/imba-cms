import { describe, expect, it } from 'vitest'
import {
  ALL_CMS_CAPABILITIES,
  CMS_CAPABILITIES,
  ROLE_CAPABILITIES,
  hasAdminAccess,
  hasCapabilities,
  hasCapability,
  resolveCapabilities,
} from './permissions'
import type { CmsRole, CmsSession, CmsUser } from './types'

const ROLES = Object.keys(ROLE_CAPABILITIES) as CmsRole[]

function sessionFor(role: CmsRole, user: Partial<CmsUser> = {}): CmsSession {
  return { user: { id: `user-${role}`, ...user }, cms_role: role }
}

describe('ROLE_CAPABILITIES', () => {
  it('covers every CmsRole', () => {
    expect(ROLES.sort()).toEqual(
      ['author', 'content_admin', 'editor', 'media_manager', 'reviewer', 'super_admin'].sort(),
    )
  })

  it('only grants capabilities that actually exist', () => {
    for (const [role, capabilities] of Object.entries(ROLE_CAPABILITIES)) {
      for (const capability of capabilities) {
        expect(ALL_CMS_CAPABILITIES, `${role} grants unknown "${capability}"`).toContain(capability)
      }
    }
  })

  it('gives super_admin everything', () => {
    expect([...resolveCapabilities(sessionFor('super_admin'))].sort()).toEqual(
      [...ALL_CMS_CAPABILITIES].sort(),
    )
  })

  it('gives no role except super_admin the system capabilities', () => {
    for (const role of ROLES.filter((r) => r !== 'super_admin')) {
      expect(hasCapability(sessionFor(role), CMS_CAPABILITIES.settingsManage), role).toBe(false)
      expect(hasCapability(sessionFor(role), CMS_CAPABILITIES.automationManage), role).toBe(false)
    }
  })
})

describe('the role x capability table', () => {
  // The regression this pins: every one of these was previously `true`, because
  // `hasCapability` short-circuited on any cms_role at all.
  const EXPECTED: Record<CmsRole, Record<string, boolean>> = {
    super_admin: { blogWrite: true, blogDelete: true, settingsManage: true, mediaWrite: true },
    content_admin: { blogWrite: true, blogDelete: true, settingsManage: false, mediaWrite: true },
    editor: { blogWrite: true, blogDelete: false, settingsManage: false, mediaWrite: true },
    author: { blogWrite: true, blogDelete: false, settingsManage: false, mediaWrite: true },
    reviewer: { blogWrite: false, blogDelete: false, settingsManage: false, mediaWrite: false },
    media_manager: { blogWrite: false, blogDelete: false, settingsManage: false, mediaWrite: true },
  }

  it.each(ROLES)('%s matches the table', (role) => {
    for (const [key, allowed] of Object.entries(EXPECTED[role])) {
      const capability = CMS_CAPABILITIES[key as keyof typeof CMS_CAPABILITIES]
      expect(hasCapability(sessionFor(role), capability), `${role} -> ${capability}`).toBe(allowed)
    }
  })

  it('lets a reviewer read but not write blog posts', () => {
    const reviewer = sessionFor('reviewer')
    expect(hasCapability(reviewer, CMS_CAPABILITIES.blogRead)).toBe(true)
    expect(hasCapability(reviewer, CMS_CAPABILITIES.blogPublish)).toBe(true)
    expect(hasCapability(reviewer, CMS_CAPABILITIES.blogWrite)).toBe(false)
    expect(hasCapability(reviewer, CMS_CAPABILITIES.blogDelete)).toBe(false)
  })

  it('lets an author write but not publish', () => {
    const author = sessionFor('author')
    expect(hasCapability(author, CMS_CAPABILITIES.blogWrite)).toBe(true)
    expect(hasCapability(author, CMS_CAPABILITIES.blogPublish)).toBe(false)
    expect(hasCapability(author, CMS_CAPABILITIES.pagesWrite)).toBe(false)
  })

  it('gives a media_manager no content capabilities', () => {
    const mediaManager = sessionFor('media_manager')
    expect(hasCapability(mediaManager, CMS_CAPABILITIES.mediaWrite)).toBe(true)
    for (const capability of ALL_CMS_CAPABILITIES.filter((c) => !c.startsWith('media.'))) {
      expect(hasCapability(mediaManager, capability), capability).toBe(false)
    }
  })
})

describe('hasAdminAccess', () => {
  it('is false for an anonymous visitor', () => {
    expect(hasAdminAccess(null)).toBe(false)
    expect(hasAdminAccess(undefined)).toBe(false)
  })

  it('is false for a signed-in user with no role and no grants', () => {
    // Regression: this used to be false only by accident, and `hasCapability`
    // for such a user returned true for every capability once any role existed.
    expect(hasAdminAccess({ user: { id: 'nobody' } } as CmsSession)).toBe(false)
    expect(hasCapability({ user: { id: 'nobody' } } as CmsSession, CMS_CAPABILITIES.blogRead)).toBe(
      false,
    )
  })

  it('is true for any role that holds at least one capability', () => {
    for (const role of ROLES) {
      expect(hasAdminAccess(sessionFor(role)), role).toBe(true)
    }
  })

  it('is true for an explicitly granted user with no role', () => {
    const user: CmsUser = { id: 'svc', app_metadata: { permissions: ['blog.read'] } }
    expect(hasAdminAccess(user)).toBe(true)
    expect(hasCapability(user, CMS_CAPABILITIES.blogRead)).toBe(true)
    expect(hasCapability(user, CMS_CAPABILITIES.blogWrite)).toBe(false)
  })
})

describe('explicit grants and infrastructure markers', () => {
  it('unions explicit permissions with the role grants', () => {
    const session = sessionFor('author', { app_metadata: { permissions: ['blog.publish'] } })
    expect(hasCapability(session, CMS_CAPABILITIES.blogWrite)).toBe(true) // from the role
    expect(hasCapability(session, CMS_CAPABILITIES.blogPublish)).toBe(true) // from the grant
    expect(hasCapability(session, CMS_CAPABILITIES.blogDelete)).toBe(false)
  })

  it('normalizes casing and whitespace on both sides', () => {
    const user: CmsUser = { id: 'u', app_metadata: { permissions: ['  BLOG.Read '] } }
    expect(hasCapability(user, ' Blog.READ ')).toBe(true)
  })

  it.each(['admin', 'service_role'])('treats the %s JWT role as full access', (role) => {
    const user: CmsUser = { id: 'infra', role }
    expect([...resolveCapabilities(user)].sort()).toEqual([...ALL_CMS_CAPABILITIES].sort())
  })

  it('treats app_metadata.is_admin as full access', () => {
    const user: CmsUser = { id: 'infra', app_metadata: { is_admin: true } }
    expect(hasCapability(user, CMS_CAPABILITIES.settingsManage)).toBe(true)
  })

  it('does not treat a non-super_admin cms_role as an infrastructure admin', () => {
    expect(hasCapability(sessionFor('content_admin'), CMS_CAPABILITIES.settingsManage)).toBe(false)
  })
})

describe('hasCapabilities', () => {
  it('is true when nothing is required', () => {
    expect(hasCapabilities(sessionFor('media_manager'))).toBe(true)
    expect(hasCapabilities(sessionFor('media_manager'), [])).toBe(true)
  })

  it('requires every listed capability', () => {
    const editor = sessionFor('editor')
    expect(hasCapabilities(editor, [CMS_CAPABILITIES.blogRead, CMS_CAPABILITIES.blogWrite])).toBe(true)
    expect(hasCapabilities(editor, [CMS_CAPABILITIES.blogWrite, CMS_CAPABILITIES.blogDelete])).toBe(
      false,
    )
  })
})
