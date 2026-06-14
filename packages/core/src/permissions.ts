import type { CapabilityRequirement, CmsCapability, CmsSession, CmsUser } from './types.js'

export const CMS_CAPABILITIES = {
  siteRead: 'site.read',
  siteWrite: 'site.write',
  sitePublish: 'site.publish',
  pagesRead: 'pages.read',
  pagesWrite: 'pages.write',
  pagesPublish: 'pages.publish',
  projectsRead: 'projects.read',
  projectsWrite: 'projects.write',
  projectsPublish: 'projects.publish',
  blogRead: 'blog.read',
  blogWrite: 'blog.write',
  blogPublish: 'blog.publish',
  blogDelete: 'blog.delete',
  blogSeed: 'blog.seed',
  blogCategoriesManage: 'blog.categories.manage',
  settingsManage: 'settings.manage',
  automationManage: 'automation.manage',
} as const satisfies Record<string, CmsCapability>

function permissionsFromUser(user: CmsUser | null | undefined): ReadonlySet<CmsCapability> {
  const permissions = user?.app_metadata?.permissions ?? []
  return new Set(
    permissions
      .filter((value: string): value is CmsCapability => typeof value === 'string' && value.trim().length > 0)
      .map((value: CmsCapability) => value.trim().toLowerCase()),
  )
}

function adminRoleFromUser(user: CmsUser | null | undefined): string | undefined {
  const directRole = user?.role?.trim().toLowerCase()
  if (directRole) return directRole

  const metadataRole = user?.app_metadata?.role
  return typeof metadataRole === 'string' ? metadataRole.trim().toLowerCase() : undefined
}

function isAdminUser(user: CmsUser | null | undefined): boolean {
  if (!user) return false

  const role = adminRoleFromUser(user)
  return Boolean(
    user.app_metadata?.is_admin
    || role === 'admin'
    || role === 'service_role'
    || role === 'super_admin'
    || role === 'content_admin',
  )
}

function resolveUser(subject: CmsSession | CmsUser | null | undefined): CmsUser | null {
  if (!subject) return null
  return 'user' in subject ? subject.user : subject
}

export function hasAdminAccess(subject: CmsSession | CmsUser | null | undefined): boolean {
  const user = resolveUser(subject)
  if (!user) return false

  const permissions = permissionsFromUser(user)
  return isAdminUser(user) || permissions.size > 0
}

export function hasCapability(
  subject: CmsSession | CmsUser | null | undefined,
  capability: CmsCapability,
): boolean {
  const user = resolveUser(subject)
  if (!user) return false
  if (isAdminUser(user)) return true
  return permissionsFromUser(user).has(capability.trim().toLowerCase())
}

export function hasCapabilities(
  subject: CmsSession | CmsUser | null | undefined,
  requirements?: CapabilityRequirement,
): boolean {
  if (!requirements || requirements.length === 0) return true
  return requirements.every((requirement: CmsCapability) => hasCapability(subject, requirement))
}
