// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Client } from 'pg'
import blog from '@imba/plugin-blog'
import media from '@imba/plugin-media'
import pages from '@imba/plugin-pages'
import projects from '@imba/plugin-projects'
import site from '@imba/plugin-site'
import { ROLE_CAPABILITIES, composeMigrations, type CmsRole } from '@imba/core'
import {
  applyMigrations,
  asRole,
  connect,
  createUser,
  hasTestDatabase,
  resetSchema,
} from './harness'

/**
 * Executes the authorization model.
 *
 * Every other assertion about RLS in this repo matches SQL *text*. These run it:
 * they are the only evidence that has_capability(), the ownership predicates and
 * the draft-visibility split behave as designed rather than merely parse.
 */

const MIGRATIONS = composeMigrations([blog, media, pages, projects, site])

describe.skipIf(!hasTestDatabase)('capability model in Postgres', () => {
  let db: Client
  const users: Record<string, string> = {}

  beforeAll(async () => {
    db = await connect()
    await resetSchema(db)
    await applyMigrations(db, MIGRATIONS)

    for (const role of Object.keys(ROLE_CAPABILITIES) as CmsRole[]) {
      users[role] = await createUser(db, { email: `${role}@example.com`, role })
    }
    users.unroled = await createUser(db, { email: 'nobody@example.com' })
  }, 120_000)

  afterAll(async () => {
    await db?.end()
  })

  async function can(userId: string, capability: string): Promise<boolean> {
    return asRole(db, 'authenticated', { sub: userId }, async (client) => {
      const { rows } = await client.query<{ ok: boolean }>(
        'select public.has_capability($1) as ok',
        [capability],
      )
      return rows[0]!.ok
    })
  }

  it('matches ROLE_CAPABILITIES for every role and capability', async () => {
    // The parity test compares the SQL *source* to the TypeScript table. This
    // compares the executed function to it, which also proves the role lookup,
    // the array membership test and the JWT plumbing all work.
    for (const [role, granted] of Object.entries(ROLE_CAPABILITIES)) {
      const held = new Set(granted)

      for (const capability of ROLE_CAPABILITIES.super_admin) {
        const actual = await can(users[role]!, capability)
        expect(actual, `${role} -> ${capability}`).toBe(held.has(capability))
      }
    }
  }, 120_000)

  it('grants nothing to a user with no role row', async () => {
    expect(await can(users.unroled!, 'blog.read')).toBe(false)
    expect(await can(users.unroled!, 'settings.manage')).toBe(false)
  })

  it('grants nothing to an anonymous caller', async () => {
    const ok = await asRole(db, 'anon', null, async (client) => {
      const { rows } = await client.query<{ ok: boolean }>(
        `select public.has_capability('blog.read') as ok`,
      )
      return rows[0]!.ok
    })
    expect(ok).toBe(false)
  })

  it('honours the app_metadata.is_admin JWT marker', async () => {
    const ok = await asRole(
      db,
      'authenticated',
      { sub: users.unroled!, app_metadata: { is_admin: true } },
      async (client) => {
        const { rows } = await client.query<{ ok: boolean }>(
          `select public.has_capability('settings.manage') as ok`,
        )
        return rows[0]!.ok
      },
    )
    expect(ok).toBe(true)
  })

  it('honours explicit app_metadata.permissions grants', async () => {
    // The MCP server scopes its service identity this way.
    const ok = await asRole(
      db,
      'authenticated',
      { sub: users.unroled!, app_metadata: { permissions: ['blog.publish'] } },
      async (client) => {
        const { rows } = await client.query<{ granted: boolean; other: boolean }>(
          `select public.has_capability('blog.publish') as granted,
                  public.has_capability('settings.manage') as other`,
        )
        return rows[0]!
      },
    )
    expect(ok.granted).toBe(true)
    expect(ok.other).toBe(false)
  })

  it('does not recurse when called from a policy on cms_user_roles', async () => {
    // has_capability reads cms_user_roles. Without SECURITY DEFINER this raises
    // "infinite recursion detected in policy for relation cms_user_roles".
    const rows = await asRole(db, 'authenticated', { sub: users.editor! }, async (client) => {
      const result = await client.query('select * from cms_user_roles')
      return result.rows.length
    })
    expect(rows).toBeGreaterThanOrEqual(0)
  })
})

describe.skipIf(!hasTestDatabase)('content RLS boundaries', () => {
  let db: Client
  const users: Record<string, string> = {}

  beforeAll(async () => {
    db = await connect()
    await resetSchema(db)
    await applyMigrations(db, MIGRATIONS)

    for (const role of ['super_admin', 'content_admin', 'editor', 'author', 'reviewer'] as const) {
      users[role] = await createUser(db, { email: `${role}@rls.example.com`, role })
    }
    users.author2 = await createUser(db, { email: 'author2@rls.example.com', role: 'author' })
  }, 120_000)

  afterAll(async () => {
    await db?.end()
  })

  beforeEach(async () => {
    await db.query('delete from pages_entries')
    await db.query('delete from blog_posts')
  })

  /**
   * Seeds on the outer connection, not through `asRole` — that helper rolls its
   * transaction back, so anything written inside it is gone before the
   * assertion runs. author_id is passed explicitly because auth.uid() is null
   * outside a request context.
   */
  async function createPost(ownerId: string, slug: string, status = 'draft'): Promise<string> {
    const { rows } = await db.query<{ id: string }>(
      `insert into blog_posts (slug, title, status, author_id)
       values ($1, $2, $3, $4) returning id`,
      [slug, slug, status, ownerId],
    )
    return rows[0]!.id
  }

  describe('pages — the draft leak and the silent write rejection', () => {
    beforeEach(async () => {
      await db.query(
        `insert into pages_entries (slug, title, status, content)
         values ('about', 'About', 'published', '{}'::jsonb),
                ('secret', 'Unreleased', 'draft', '{}'::jsonb)`,
      )
    })

    it('hides drafts from anonymous readers', async () => {
      // Was `using (true)`: anyone with the public anon key could read every
      // unpublished page.
      const slugs = await asRole(db, 'anon', null, async (client) => {
        const { rows } = await client.query<{ slug: string }>('select slug from pages_entries')
        return rows.map((r) => r.slug)
      })

      expect(slugs).toEqual(['about'])
    })

    it('shows drafts to staff holding pages.read', async () => {
      const slugs = await asRole(db, 'authenticated', { sub: users.editor! }, async (client) => {
        const { rows } = await client.query<{ slug: string }>(
          'select slug from pages_entries order by slug',
        )
        return rows.map((r) => r.slug)
      })

      expect(slugs).toEqual(['about', 'secret'])
    })

    it('lets an editor save — the write that used to be silently swallowed', async () => {
      // The headline bug: is_admin() resolved only super_admin, so an editor
      // could edit in the UI and have the update rejected with no error.
      const updated = await asRole(db, 'authenticated', { sub: users.editor! }, async (client) => {
        const { rowCount } = await client.query(
          `update pages_entries set title = 'Edited' where slug = 'about'`,
        )
        return rowCount
      })

      expect(updated).toBe(1)
    })

    it('lets a content_admin save', async () => {
      const updated = await asRole(
        db,
        'authenticated',
        { sub: users.content_admin! },
        async (client) => {
          const { rowCount } = await client.query(
            `update pages_entries set title = 'Edited' where slug = 'about'`,
          )
          return rowCount
        },
      )

      expect(updated).toBe(1)
    })

    it('refuses an author, who holds only pages.read', async () => {
      const updated = await asRole(db, 'authenticated', { sub: users.author! }, async (client) => {
        const { rowCount } = await client.query(
          `update pages_entries set title = 'Nope' where slug = 'about'`,
        )
        return rowCount
      })

      // An UPDATE whose USING clause rejects the row affects zero rows rather
      // than raising — which is why the admin UI needs describeSilentDenial.
      expect(updated).toBe(0)
    })
  })

  describe('blog — ownership', () => {
    /**
     * Seeds on the outer connection, not through `asRole` — that helper rolls
     * its transaction back, so anything written inside it is gone by the time
     * the assertion runs. author_id is passed explicitly because auth.uid() is
     * null outside a request context.
     */


    it('stamps author_id from the session on insert', async () => {
      // author_id existed since V001 and nothing ever wrote it.
      await asRole(db, 'authenticated', { sub: users.author! }, async (client) => {
        await client.query(
          `insert into blog_posts (slug, title, status) values ('owned', 'Owned', 'draft')`,
        )
        const { rows } = await client.query<{ author_id: string }>(
          `select author_id from blog_posts where slug = 'owned'`,
        )
        expect(rows[0]!.author_id).toBe(users.author!)
      })
    })

    it('lets an author edit their own post', async () => {
      await asRole(db, 'authenticated', { sub: users.author! }, async (client) => {
        await client.query(
          `insert into blog_posts (slug, title, status) values ('mine', 'Mine', 'draft')`,
        )
        const { rowCount } = await client.query(
          `update blog_posts set title = 'Mine v2' where slug = 'mine'`,
        )
        expect(rowCount).toBe(1)
      })
    })

    it("refuses an author editing another author's post", async () => {
      await createPost(users.author!, 'theirs')

      const updated = await asRole(db, 'authenticated', { sub: users.author2! }, async (client) => {
        const { rowCount } = await client.query(
          `update blog_posts set title = 'Hijacked' where slug = 'theirs'`,
        )
        return rowCount
      })

      expect(updated).toBe(0)
    })

    it('lets an editor edit any post, via blog.write.any', async () => {
      await createPost(users.author!, 'theirs')

      const updated = await asRole(db, 'authenticated', { sub: users.editor! }, async (client) => {
        const { rowCount } = await client.query(
          `update blog_posts set title = 'Edited' where slug = 'theirs'`,
        )
        return rowCount
      })

      expect(updated).toBe(1)
    })

    it('refuses delete to an editor, who lacks blog.delete', async () => {
      await createPost(users.author!, 'doomed')

      const deleted = await asRole(db, 'authenticated', { sub: users.editor! }, async (client) => {
        const { rowCount } = await client.query(`delete from blog_posts where slug = 'doomed'`)
        return rowCount
      })

      expect(deleted).toBe(0)
    })

    it('allows delete to a content_admin', async () => {
      await createPost(users.author!, 'doomed')

      const deleted = await asRole(
        db,
        'authenticated',
        { sub: users.content_admin! },
        async (client) => {
          const { rowCount } = await client.query(`delete from blog_posts where slug = 'doomed'`)
          return rowCount
        },
      )

      expect(deleted).toBe(1)
    })
  })

  describe('blog — reviewer publishes without write access', () => {
    it('refuses a reviewer a direct update', async () => {
      await createPost(users.author!, 'review-me', 'in_review')

      const updated = await asRole(
        db,
        'authenticated',
        { sub: users.reviewer! },
        async (client) => {
          const { rowCount } = await client.query(
            `update blog_posts set body = 'rewritten' where slug = 'review-me'`,
          )
          return rowCount
        },
      )

      // The point of the RPC: a reviewer must not be able to rewrite the body.
      expect(updated).toBe(0)
    })

    it('lets a reviewer publish through blog_set_post_status', async () => {
      const id = await createPost(users.author!, 'publish-me', 'in_review')

      const status = await asRole(
        db,
        'authenticated',
        { sub: users.reviewer! },
        async (client) => {
          const { rows } = await client.query<{ status: string; published: boolean }>(
            `select status, published from public.blog_set_post_status($1, 'published')`,
            [id],
          )
          return rows[0]!
        },
      )

      expect(status.status).toBe('published')
      expect(status.published).toBe(true)
    })

    it('refuses an author publishing through the RPC', async () => {
      const id = await createPost(users.author!, 'mine-again', 'draft')

      await expect(
        asRole(db, 'authenticated', { sub: users.author! }, (client) =>
          client.query(`select public.blog_set_post_status($1, 'published')`, [id]),
        ),
      ).rejects.toMatchObject({ code: '42501' })
    })

    it('rejects an invalid status', async () => {
      const id = await createPost(users.author!, 'bad-status', 'draft')

      await expect(
        asRole(db, 'authenticated', { sub: users.editor! }, (client) =>
          client.query(`select public.blog_set_post_status($1, 'nonsense')`, [id]),
        ),
      ).rejects.toMatchObject({ code: '22023' })
    })

    it('writes a revision and an audit row on publish', async () => {
      const id = await createPost(users.author!, 'audited', 'in_review')

      // Publish and assert inside one transaction: asRole rolls back, so rows
      // written by the trigger are only visible while it is still open.
      // Runs as content_admin, the role holding blog.publish *and* audit.read.
      const seen = await asRole(
        db,
        'authenticated',
        { sub: users.content_admin!, email: 'content_admin@rls.example.com' },
        async (client) => {
          await client.query(`select public.blog_set_post_status($1, 'published')`, [id])

          const { rows: revisions } = await client.query(
            'select id from blog_post_revisions where post_id = $1',
            [id],
          )
          const { rows: audit } = await client.query<{ event_type: string; actor_id: string }>(
            'select event_type, actor_id from blog_post_audit_log where post_id = $1',
            [id],
          )
          return { revisions: revisions.length, audit }
        },
      )

      expect(seen.revisions).toBeGreaterThanOrEqual(1)
      expect(seen.audit.map((r) => r.event_type)).toContain('status_changed')

      // The trigger is SECURITY DEFINER, but auth.uid() still resolves the
      // caller — the audit row must name the human, not the definer. Selected
      // by event_type: the 'created' row was seeded outside a request context
      // and correctly has no actor.
      const transition = seen.audit.find((r) => r.event_type === 'status_changed')
      expect(transition!.actor_id).toBe(users.content_admin!)
    })
  })
})
