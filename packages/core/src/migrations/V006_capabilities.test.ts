// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ALL_CMS_CAPABILITIES, CMS_ROLES, ROLE_CAPABILITIES } from '../permissions'
import type { CmsRole } from '../types'

/**
 * The parity gate.
 *
 * `has_capability()` in Postgres and `resolveCapabilities()` in TypeScript
 * answer the same question for the same user, and they must agree: the admin UI
 * decides what to render from the TS table, while RLS decides what actually
 * succeeds from the SQL one. When they disagreed, a content_admin saw the Pages
 * editor and had every save silently swallowed.
 *
 * This parses the CASE arms out of the migration and asserts set-equality
 * against the TypeScript table, per role. Encoding the model as a CASE — rather
 * than a capabilities join table — is what makes that check possible at all.
 */

const SQL = readFileSync(fileURLToPath(new URL('./V006_capabilities.sql', import.meta.url)), 'utf8')

/** Extracts `when '<role>' then array[ ... ]` into a capability set. */
function sqlCapabilitiesFor(role: string): string[] {
  const arm = new RegExp(`when\\s+'${role}'\\s+then\\s+array\\[([\\s\\S]*?)\\]`, 'i').exec(SQL)
  if (!arm) throw new Error(`V006 has no CASE arm for role "${role}"`)

  return [...arm[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
}

describe('V006 capability model', () => {
  it('defines an arm for every CmsRole', () => {
    for (const role of CMS_ROLES) {
      expect(() => sqlCapabilitiesFor(role), `missing SQL arm for ${role}`).not.toThrow()
    }
  })

  it.each(CMS_ROLES)('%s matches ROLE_CAPABILITIES exactly', (role: CmsRole) => {
    const fromSql = [...sqlCapabilitiesFor(role)].sort()
    const fromTs = [...ROLE_CAPABILITIES[role]].sort()

    expect(fromSql).toEqual(fromTs)
  })

  it('grants no capability the TypeScript model does not define', () => {
    for (const role of CMS_ROLES) {
      for (const capability of sqlCapabilitiesFor(role)) {
        expect(ALL_CMS_CAPABILITIES, `${role} grants unknown "${capability}"`).toContain(capability)
      }
    }
  })

  it('lists no capability twice within an arm', () => {
    for (const role of CMS_ROLES) {
      const capabilities = sqlCapabilitiesFor(role)
      expect(new Set(capabilities).size, `${role} has duplicates`).toBe(capabilities.length)
    }
  })

  it('falls back to an empty array for an unknown role', () => {
    expect(SQL).toMatch(/else\s+array\[\]::text\[\]/i)
  })

  it('is SECURITY DEFINER with a pinned search_path', () => {
    // has_capability reads cms_user_roles, so an invoker-rights version called
    // from a policy on that table would raise "infinite recursion detected".
    expect(SQL).toMatch(
      /create or replace function public\.has_capability[\s\S]*?security definer[\s\S]*?set search_path = public, pg_temp/i,
    )
  })

  it('honours the same non-role grants as resolveCapabilities', () => {
    expect(SQL).toMatch(/app_metadata' ->> 'is_admin/)
    expect(SQL).toMatch(/app_metadata' -> 'permissions/)
    expect(SQL).toMatch(/'role'\) = 'admin'/)
    expect(SQL).toMatch(/'role'\) = 'service_role'/)
  })

  it('revokes the default public execute grant', () => {
    expect(SQL).toMatch(/revoke all on function public\.has_capability\(text\) from public/i)
  })
})
