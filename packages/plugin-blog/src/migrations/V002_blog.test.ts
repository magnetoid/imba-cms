import { describe, expect, it } from 'vitest'
import sql from './V002_blog.sql?raw'

describe('blog V002 migration', () => {
  it('adds workflow columns, revision tables, and audit log tables', () => {
    expect(sql).toMatch(/scheduled_for/i)
    expect(sql).toMatch(/first_published_at/i)
    expect(sql).toMatch(/blog_post_revisions/i)
    expect(sql).toMatch(/blog_post_audit_log/i)
  })

  it('tightens public reads to published posts only', () => {
    expect(sql).toMatch(/create policy "public_read_blog_posts"/i)
    expect(sql).toMatch(/status = 'published'/i)
    expect(sql).toMatch(/published = true/i)
  })

  it('installs normalization and audit triggers for blog posts', () => {
    expect(sql).toMatch(/normalize_blog_post_workflow/i)
    expect(sql).toMatch(/audit_blog_post_write/i)
    expect(sql).toMatch(/create trigger blog_posts_normalize_workflow_before_write/i)
    expect(sql).toMatch(/create trigger blog_posts_audit_after_write/i)
  })
})
