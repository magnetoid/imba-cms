import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CMS_CAPABILITIES,
  parseCmsRole,
  resolveCapabilities,
  type CmsCapability,
  type CmsRole,
  type CmsSession,
  type CmsUser,
} from '@imba/core'

/**
 * Server-side capability resolution.
 *
 * This exists because `db.auth.getUser(token)` returns a GoTrue **User**, not a
 * `CmsSession`. Handing that straight to `hasCapability` — which is what this
 * service used to do — silently resolves to the empty set: `resolveCapabilities`
 * only reads `cms_role` off a session (`'user' in subject` is false for a bare
 * User), GoTrue sets `user.role` to `'authenticated'` rather than any admin
 * marker, and `app_metadata` carries `{provider, providers}` with no
 * `permissions` array. The result was a 403 for every legitimately-roled user.
 *
 * So the role has to be looked up explicitly and assembled into the session
 * shape the shared resolver expects. The resolver itself is deliberately reused
 * rather than reimplemented: it already unions role grants with explicit
 * `app_metadata.permissions`, which is what keeps the MCP server's
 * synthetic-subject path working against the same logic.
 *
 * `db` here must be the **service-role** client (`createServiceClient`), because
 * `cms_user_roles` is no longer anon-readable after core V005.
 */

export type AuthDb = Pick<SupabaseClient, 'from' | 'auth'>

export interface ServerSubject {
  user: CmsUser
  cms_role?: CmsRole
  capabilities: ReadonlySet<CmsCapability>
}

/** Thrown when the bearer token is absent, malformed or rejected by GoTrue. */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** Thrown when the caller is known but lacks the required capability. */
export class ForbiddenError extends Error {
  readonly required: readonly CmsCapability[]

  constructor(required: readonly CmsCapability[]) {
    super('Forbidden')
    this.name = 'ForbiddenError'
    this.required = required
  }
}

/**
 * Short-lived token → subject cache.
 *
 * A single admin page load fans out to several settings requests, each of which
 * would otherwise cost a `getUser` round trip plus a `cms_user_roles` select.
 * The TTL is deliberately short: a role change must take effect quickly, and 30
 * seconds is well inside "the admin clicks save, then reloads".
 *
 * Keyed by a hash of the token so raw credentials are not held as map keys.
 */
const CACHE_TTL_MS = 30_000
const CACHE_MAX_ENTRIES = 500

interface CacheEntry {
  subject: ServerSubject
  expiresAt: number
}

const subjectCache = new Map<string, CacheEntry>()

function cacheKey(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('base64url')
}

function readCache(key: string, now: number): ServerSubject | null {
  const entry = subjectCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now) {
    subjectCache.delete(key)
    return null
  }
  return entry.subject
}

function writeCache(key: string, subject: ServerSubject, now: number): void {
  // Map preserves insertion order, so the first key is the oldest.
  if (subjectCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = subjectCache.keys().next()
    if (!oldest.done) subjectCache.delete(oldest.value)
  }
  subjectCache.set(key, { subject, expiresAt: now + CACHE_TTL_MS })
}

/** Exposed for tests and for invalidation after a role change. */
export function clearServerSubjectCache(): void {
  subjectCache.clear()
}

async function loadCmsRole(db: AuthDb, userId: string): Promise<CmsRole | undefined> {
  const result = await db
    .from('cms_user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  // A missing row is the normal "no CMS role assigned" case. A real query error
  // must not be swallowed into "no capabilities" — that would turn a transient
  // database fault into a silent authorization denial.
  if (result.error) throw new Error(`Failed to resolve CMS role: ${result.error.message}`)

  return parseCmsRole(result.data?.role)
}

/**
 * Resolves a bearer token to its user, CMS role and full capability set.
 * Throws `UnauthorizedError` when the token is not valid.
 */
export async function resolveServerSubject(
  db: AuthDb,
  accessToken: string,
  now: number = Date.now(),
): Promise<ServerSubject> {
  if (!accessToken || accessToken.trim().length === 0) throw new UnauthorizedError()

  const key = cacheKey(accessToken)
  const cached = readCache(key, now)
  if (cached) return cached

  const result = await db.auth.getUser(accessToken)
  if (result.error || !result.data.user) throw new UnauthorizedError()

  const user = result.data.user as unknown as CmsUser
  const cms_role = await loadCmsRole(db, user.id)

  // Assembled into `CmsSession` shape so the shared resolver reads cms_role.
  const session: CmsSession = { user, cms_role }
  const subject: ServerSubject = {
    user,
    cms_role,
    capabilities: resolveCapabilities(session),
  }

  writeCache(key, subject, now)
  return subject
}

export async function resolveServerCapabilities(
  db: AuthDb,
  accessToken: string,
): Promise<ReadonlySet<CmsCapability>> {
  return (await resolveServerSubject(db, accessToken)).capabilities
}

/** Requires every listed capability. Throws `ForbiddenError` if any is missing. */
export async function requireCapabilityAccess(
  db: AuthDb,
  accessToken: string,
  ...capabilities: CmsCapability[]
): Promise<ServerSubject> {
  const subject = await resolveServerSubject(db, accessToken)
  const missing = capabilities.filter((capability) => !subject.capabilities.has(capability))
  if (missing.length > 0) throw new ForbiddenError(missing)
  return subject
}

/** Convenience wrapper for the settings endpoints. */
export async function requireSettingsAccess(
  db: AuthDb,
  accessToken: string,
): Promise<ServerSubject> {
  return requireCapabilityAccess(db, accessToken, CMS_CAPABILITIES.settingsManage)
}

/** Requires at least one of the listed capabilities. */
export async function requireAnyCapability(
  db: AuthDb,
  accessToken: string,
  capabilities: readonly CmsCapability[],
): Promise<ServerSubject> {
  const subject = await resolveServerSubject(db, accessToken)
  if (!capabilities.some((capability) => subject.capabilities.has(capability))) {
    throw new ForbiddenError(capabilities)
  }
  return subject
}
