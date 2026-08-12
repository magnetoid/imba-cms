import { describe, expect, it } from 'vitest'
import v001 from './V001_pages.sql?raw'
import raw from './V002_pages_rbac.sql?raw'

/**
 * Executable SQL only. The migration's header comment quotes the very patterns
 * these tests assert are gone, so prose must not satisfy — or defeat — them.
 */
const sql = raw.replace(/^\s*--.*$/gm, '')

describe('pages V002 rbac migration', () => {
  it('retires the is_admin()-gated write policy', () => {
    // V001 gated writes on is_admin(), which resolves only super_admin — while
    // the admin UI showed the editor to anyone with pages.write. Saves from a
    // content_admin or editor were silently swallowed by RLS.
    expect(v001).toMatch(/create policy pages_entries_write[\s\S]*is_admin\(\)/i)
    expect(sql).toMatch(/drop policy if exists pages_entries_write on pages_entries/i)
    expect(sql).not.toMatch(/is_admin\(\)/i)
  })

  it('closes the draft leak to anonymous callers', () => {
    // V001 read policy was `using (true)`, publishing every draft row to anyone
    // holding the anon key.
    expect(v001).toMatch(/create policy pages_entries_read[\s\S]*?using \(true\)/i)
    expect(sql).toMatch(/drop policy if exists pages_entries_read on pages_entries/i)
    expect(sql).toMatch(
      /create policy pages_entries_public_read[\s\S]*?using \(status = 'published'\)/i,
    )
  })

  it('gives staff a separate draft-visible read policy', () => {
    expect(sql).toMatch(
      /create policy pages_entries_staff_read[\s\S]*?has_capability\('pages\.read'\)/i,
    )
  })

  it.each(['insert', 'update', 'delete'])('gates %s on a capability', (operation) => {
    const policy = new RegExp(
      `create policy pages_entries_${operation}[\\s\\S]*?has_capability\\('pages\\.(write|publish)'\\)`,
      'i',
    )
    expect(sql).toMatch(policy)
  })

  it('lets publish permit an update, so a reviewer can act without write', () => {
    const update = /create policy pages_entries_update([\s\S]*?);/i.exec(sql)
    expect(update).not.toBeNull()
    expect(update![1]).toMatch(/pages\.publish/)
  })

  it('leaves no policy readable by everyone', () => {
    expect(sql).not.toMatch(/using \(true\)/i)
  })
})
