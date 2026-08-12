// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Client } from 'pg'
import blog from '@imba/plugin-blog'
import media from '@imba/plugin-media'
import pages from '@imba/plugin-pages'
import projects from '@imba/plugin-projects'
import site from '@imba/plugin-site'
import { composeMigrations } from '@imba/core'
import {
  applyMigrations,
  asRole,
  connect,
  createUser,
  hasTestDatabase,
  resetSchema,
} from './harness'

/**
 * Executes the migrations. Everything else in the suite asserts SQL *text*;
 * these assertions run it.
 *
 * Set IMBA_TEST_DATABASE_URL to enable, e.g.
 *   IMBA_TEST_DATABASE_URL=postgres://localhost:5432/imba_cms_test pnpm test
 */

const MIGRATIONS = composeMigrations([blog, media, pages, projects, site])

describe.skipIf(!hasTestDatabase)('migrations against a real Postgres', () => {
  let db: Client

  beforeAll(async () => {
    db = await connect()
    await resetSchema(db)
    await applyMigrations(db, MIGRATIONS)
  }, 120_000)

  afterAll(async () => {
    await db?.end()
  })

  it('applies the whole composed set cleanly', async () => {
    const { rows } = await db.query<{ id: string }>('select id from schema_migrations order by id')
    expect(rows.map((r) => r.id).sort()).toEqual(MIGRATIONS.map((m) => m.id).sort())
  })

  it('creates the expected tables', async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    )
    const tables = rows.map((r) => r.table_name)

    for (const expected of [
      'schema_migrations',
      'cms_user_roles',
      'cms_settings',
      'cms_private_settings',
      'blog_posts',
      'blog_post_revisions',
      'blog_post_audit_log',
      'media_files',
      'pages_entries',
      'projects_entries',
      'site_entries',
    ]) {
      expect(tables, `missing table ${expected}`).toContain(expected)
    }
  })

  it('has row level security enabled on every content table', async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
          and c.relname in ('blog_posts','pages_entries','projects_entries','site_entries',
                            'media_files','cms_user_roles','cms_settings')`,
    )

    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.relrowsecurity, `${row.relname} has RLS disabled`).toBe(true)
    }
  })

  /**
   * V001–V004 create ten policies with a bare `create policy` and no
   * `drop policy if exists` guard, so re-running one raises 42710. That is
   * grandfathered rather than fixed:
   *
   *   - they are reachable from a shipped tag, and editing them would change
   *     their sha256, which the release manifest's immutability check rejects;
   *   - the update engine applies only *pending* migrations
   *     (`planMigrations(managed, appliedIds)`), so an applied one never re-runs;
   *   - each migration is applied inside its own transaction with its
   *     schema_migrations insert, so a failure rolls back entirely and a retry
   *     starts from a clean slate.
   *
   * Everything from V005 onward uses the guard, and this test holds new
   * migrations to that standard.
   */
  const GRANDFATHERED = ['core.V001', 'core.V002', 'core.V003', 'core.V004']

  it.each(MIGRATIONS.filter((m) => !GRANDFATHERED.includes(m.id)).map((m) => [m.id, m] as const))(
    '%s is individually idempotent',
    async (_id, migration) => {
      await applyMigrations(db, [migration], { recordApplied: false })
    },
    60_000,
  )

  it('guards every create policy in a non-grandfathered migration', async () => {
    // A static companion to the test above: catches the omission at authoring
    // time even for a migration whose re-run happens to succeed.
    for (const migration of MIGRATIONS) {
      if (GRANDFATHERED.includes(migration.id)) continue

      const code = migration.sql.replace(/^\s*--.*$/gm, '')
      const created = [...code.matchAll(/create policy\s+"?([a-z0-9_]+)"?/gi)].map((m) =>
        m[1]!.toLowerCase(),
      )
      const guarded = new Set(
        [...code.matchAll(/drop policy if exists\s+"?([a-z0-9_]+)"?/gi)].map((m) =>
          m[1]!.toLowerCase(),
        ),
      )

      for (const policy of created) {
        expect(guarded, `${migration.id}: "${policy}" needs a drop-if-exists guard`).toContain(
          policy,
        )
      }
    }
  })
})

describe.skipIf(!hasTestDatabase)('the harness itself', () => {
  let db: Client

  beforeAll(async () => {
    db = await connect()
    await resetSchema(db)
    await applyMigrations(db, MIGRATIONS)
  }, 120_000)

  afterAll(async () => {
    await db?.end()
  })

  it('actually observes a denial', async () => {
    // Canary. The connection owner is superuser and exempt from RLS, so if
    // `set local role` ever stopped working every policy assertion in this file
    // would pass vacuously. cms_settings is anon-unreadable after core V005.
    await db.query(
      `insert into cms_settings (plugin, key, value)
       values ('probe', 'probe', '"x"'::jsonb) on conflict do nothing`,
    )

    const visible = await asRole(db, 'anon', null, async (client) => {
      const { rows } = await client.query(`select key from cms_settings where plugin = 'probe'`)
      return rows.length
    })

    expect(visible).toBe(0)
  })

  it('sees rows as the superuser owner, proving the canary is meaningful', async () => {
    const { rows } = await db.query(`select key from cms_settings where plugin = 'probe'`)
    expect(rows.length).toBe(1)
  })

  it('resolves auth.uid() from the injected claims', async () => {
    const userId = await createUser(db, { email: 'uid@example.com' })

    const seen = await asRole(db, 'authenticated', { sub: userId }, async (client) => {
      const { rows } = await client.query<{ uid: string | null }>('select auth.uid() as uid')
      return rows[0]!.uid
    })

    expect(seen).toBe(userId)
  })
})
