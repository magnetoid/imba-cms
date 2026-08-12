import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDestructiveSql } from './safety'

/**
 * Scans every migration this repo actually ships.
 *
 * Two jobs, both permanent:
 *  1. Prove the additive-only guard does not refuse our own migrations. The
 *     previous whole-file `ALTER TABLE ... DROP` rule flagged 7 of 12, which
 *     meant a real `imba update` was blocked-or-`--force` — and `--force`
 *     disables the guard wholesale.
 *  2. Catch a genuinely destructive new migration at test time rather than at
 *     release time, when it would already be tagged and immutable.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

function collectMigrations(): { id: string; file: string; sql: string }[] {
  const found: { id: string; file: string; sql: string }[] = []

  for (const pkg of readdirSync(PACKAGES_DIR)) {
    const dir = join(PACKAGES_DIR, pkg, 'src', 'migrations')
    let entries: string[]
    try {
      if (!statSync(dir).isDirectory()) continue
      entries = readdirSync(dir)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.endsWith('.sql')) continue
      found.push({
        id: `${pkg}/${entry}`,
        file: join(dir, entry),
        sql: readFileSync(join(dir, entry), 'utf8'),
      })
    }
  }

  return found.sort((a, b) => a.id.localeCompare(b.id))
}

const MIGRATIONS = collectMigrations()

describe('shipped migration corpus', () => {
  it('finds the migrations on disk', () => {
    // Guards against the glob silently breaking and the suite passing vacuously.
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(10)
  })

  it.each(MIGRATIONS.map((m) => [m.id, m.sql] as const))(
    '%s is additive',
    (_id, sql) => {
      const scan = isDestructiveSql(sql)
      expect(scan.reasons).toEqual([])
      expect(scan.destructive).toBe(false)
    },
  )

  it('reports every migration as additive in aggregate', () => {
    const destructive = MIGRATIONS
      .map((m) => ({ id: m.id, ...isDestructiveSql(m.sql) }))
      .filter((m) => m.destructive)

    expect(destructive).toEqual([])
  })
})
