import type { CapabilityRequirement, CmsCapability, CmsRole, CmsSession, CmsUser } from './types.js'

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
  /** Edit posts owned by someone else. `blog.write` alone means "your own". */
  blogWriteAny: 'blog.write.any',
  blogPublish: 'blog.publish',
  blogDelete: 'blog.delete',
  blogSeed: 'blog.seed',
  blogCategoriesManage: 'blog.categories.manage',
  mediaRead: 'media.read',
  mediaWrite: 'media.write',
  settingsManage: 'settings.manage',
  automationManage: 'automation.manage',
  /** Invite users and assign roles. Deliberately super_admin only. */
  usersManage: 'users.manage',
  auditRead: 'audit.read',
} as const satisfies Record<string, CmsCapability>

/** Every capability the CMS defines. */
export const ALL_CMS_CAPABILITIES: readonly CmsCapability[] = Object.freeze(
  Object.values(CMS_CAPABILITIES),
)

const C = CMS_CAPABILITIES

/**
 * What each role may do.
 *
 * This table is the authorization model. It previously did not exist: every one
 * of the six roles was treated as a full administrator, so the capabilities
 * below — and every `requiredCapabilities` declaration on a route, nav item or
 * dashboard widget — had no effect at all.
 *
 * The client-side check is a UX affordance; the enforceable boundary is the
 * matching RLS policy in Postgres. The two must be kept in agreement.
 */
export const ROLE_CAPABILITIES: Record<CmsRole, readonly CmsCapability[]> = Object.freeze({
  /** Unrestricted, including system settings and automation. */
  super_admin: ALL_CMS_CAPABILITIES,

  /** Owns all content, but not system configuration. */
  content_admin: Object.freeze([
    C.siteRead, C.siteWrite, C.sitePublish,
    C.pagesRead, C.pagesWrite, C.pagesPublish,
    C.projectsRead, C.projectsWrite, C.projectsPublish,
    C.blogRead, C.blogWrite, C.blogWriteAny, C.blogPublish, C.blogDelete, C.blogSeed,
    C.blogCategoriesManage,
    C.mediaRead, C.mediaWrite,
    C.auditRead,
  ]),

  /** Writes and publishes content; cannot delete, seed, or change site chrome. */
  editor: Object.freeze([
    C.siteRead,
    C.pagesRead, C.pagesWrite, C.pagesPublish,
    C.projectsRead, C.projectsWrite, C.projectsPublish,
    C.blogRead, C.blogWrite, C.blogWriteAny, C.blogPublish, C.blogCategoriesManage,
    C.mediaRead, C.mediaWrite,
  ]),

  /** Drafts content and submits it for review. Cannot publish. */
  author: Object.freeze([
    C.siteRead,
    C.pagesRead,
    C.projectsRead,
    C.blogRead, C.blogWrite,
    C.mediaRead, C.mediaWrite,
  ]),

  /** Approves and publishes what others wrote. Cannot author or delete. */
  reviewer: Object.freeze([
    C.siteRead,
    C.pagesRead, C.pagesPublish,
    C.projectsRead, C.projectsPublish,
    C.blogRead, C.blogPublish,
    C.mediaRead,
  ]),

  /** The asset library only. */
  media_manager: Object.freeze([C.mediaRead, C.mediaWrite]),
})

/** The valid `cms_user_roles.role` values, derived from the table above. */
export const CMS_ROLES = Object.freeze(Object.keys(ROLE_CAPABILITIES) as CmsRole[])

/**
 * Narrows an untrusted value (a DB column, a JWT claim) to a known role.
 * Returns `undefined` rather than throwing: an unrecognised role must resolve
 * to no capabilities, not to an error that a caller might swallow into a grant.
 */
export function parseCmsRole(value: unknown): CmsRole | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase() as CmsRole
  return CMS_ROLES.includes(normalized) ? normalized : undefined
}

function normalize(value: string): CmsCapability {
  return value.trim().toLowerCase()
}

/**
 * Explicit per-user grants from the JWT. These are unioned with the role's set,
 * which is how service identities (the MCP server builds a synthetic subject
 * carrying only `permissions`) and narrowly-scoped tokens work.
 */
function permissionsFromUser(user: CmsUser | null | undefined): CmsCapability[] {
  const permissions = user?.app_metadata?.permissions ?? []
  return permissions
    .filter((value: string): value is CmsCapability => typeof value === 'string' && value.trim().length > 0)
    .map(normalize)
}

function adminRoleFromUser(user: CmsUser | null | undefined): string | undefined {
  const directRole = user?.role?.trim().toLowerCase()
  if (directRole) return directRole

  const metadataRole = user?.app_metadata?.role
  return typeof metadataRole === 'string' ? metadataRole.trim().toLowerCase() : undefined
}

/**
 * Infrastructure-level full-access markers, mirroring the SQL `is_admin()`
 * function: a Supabase `service_role` key, an `admin` JWT role, or an explicit
 * `app_metadata.is_admin` flag. Note this is deliberately NOT satisfied by any
 * `cms_role` other than `super_admin` — that conflation is what collapsed the
 * whole model.
 */
function hasFullAccessMarker(user: CmsUser | null | undefined): boolean {
  if (!user) return false
  const role = adminRoleFromUser(user)
  return Boolean(user.app_metadata?.is_admin || role === 'admin' || role === 'service_role')
}

function resolveUser(subject: CmsSession | CmsUser | null | undefined): CmsUser | null {
  if (!subject) return null
  return 'user' in subject ? subject.user : subject
}

function resolveSession(subject: CmsSession | CmsUser | null | undefined): CmsSession | null {
  if (!subject) return null
  return 'user' in subject ? (subject as CmsSession) : null
}

/**
 * The full set of capabilities a subject holds: the union of its `cms_role`
 * grants and any explicit `app_metadata.permissions`.
 */
export function resolveCapabilities(
  subject: CmsSession | CmsUser | null | undefined,
): ReadonlySet<CmsCapability> {
  const user = resolveUser(subject)
  if (!user) return new Set()

  if (hasFullAccessMarker(user)) return new Set(ALL_CMS_CAPABILITIES)

  const role = resolveSession(subject)?.cms_role
  const fromRole = role ? (ROLE_CAPABILITIES[role] ?? []) : []

  return new Set([...fromRole, ...permissionsFromUser(user)])
}

/**
 * Whether the subject may enter the admin app at all. True when it holds at
 * least one capability — not merely when it is signed in.
 */
export function hasAdminAccess(subject: CmsSession | CmsUser | null | undefined): boolean {
  return resolveCapabilities(subject).size > 0
}

export function hasCapability(
  subject: CmsSession | CmsUser | null | undefined,
  capability: CmsCapability,
): boolean {
  return resolveCapabilities(subject).has(normalize(capability))
}

export function hasCapabilities(
  subject: CmsSession | CmsUser | null | undefined,
  requirements?: CapabilityRequirement,
): boolean {
  if (!requirements || requirements.length === 0) return true

  const held = resolveCapabilities(subject)
  return requirements.every((requirement: CmsCapability) => held.has(normalize(requirement)))
}
