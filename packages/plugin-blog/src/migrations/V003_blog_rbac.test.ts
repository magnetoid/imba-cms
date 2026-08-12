import { describe, expect, it } from 'vitest'
import v001 from './V001_blog.sql?raw'
import raw from './V003_blog_rbac.sql?raw'

/** Executable SQL only — the header comment quotes the patterns under test. */
const sql = raw.replace(/^\s*--.*$/gm, '')

describe('blog V003 rbac migration', () => {
  it('retires the single FOR ALL policy that covered five roles', () => {
    // V001 gave author, reviewer, editor, content_admin and super_admin the
    // same grant for every operation: an author could edit anyone's post, a
    // reviewer could rewrite bodies, and blog.delete was not distinguished.
    expect(v001).toMatch(/create policy "admin_all_blog_posts"[\s\S]*?has_role\(array\[/i)
    expect(sql).toMatch(/drop policy if exists "admin_all_blog_posts" on public\.blog_posts/i)
  })

  it('gives posts an owner', () => {
    // author_id existed since V001 but nothing ever wrote it.
    expect(sql).toMatch(/alter column author_id set default auth\.uid\(\)/i)
    expect(sql).toMatch(/NEW\.author_id := COALESCE\(NEW\.author_id, auth\.uid\(\)\)/i)
  })

  it('restricts update to the owner unless blog.write.any is held', () => {
    const update = /create policy blog_posts_update([\s\S]*?);/i.exec(sql)
    expect(update).not.toBeNull()
    expect(update![1]).toMatch(/blog\.write\.any/)
    expect(update![1]).toMatch(/author_id = auth\.uid\(\)/)
  })

  it('separates delete behind blog.delete', () => {
    const del = /create policy blog_posts_delete([\s\S]*?);/i.exec(sql)
    expect(del).not.toBeNull()
    expect(del![1]).toMatch(/has_capability\('blog\.delete'\)/)
    expect(del![1]).not.toMatch(/blog\.write/)
  })

  it('keeps staff able to read their drafts', () => {
    // V002 narrowed public_read_blog_posts to published rows, so dropping the
    // FOR ALL policy without this would hide every draft from its own author.
    expect(sql).toMatch(
      /create policy blog_posts_staff_read[\s\S]*?has_capability\('blog\.read'\)/i,
    )
  })

  it('routes publishing through a capability-checked function', () => {
    // RLS gates rows, not columns, so an UPDATE policy permissive enough to
    // change status is permissive enough to rewrite the body. A reviewer must
    // be able to do the first and not the second.
    expect(sql).toMatch(/create or replace function public\.blog_set_post_status/i)
    expect(sql).toMatch(/security definer[\s\S]*?set search_path = public, pg_temp/i)
    expect(sql).toMatch(/has_capability\('blog\.publish'\)/)
    expect(sql).toMatch(/errcode = '42501'/)
  })

  it('validates the status argument against the workflow enum', () => {
    const fn = /create or replace function public\.blog_set_post_status([\s\S]*?)\$\$;/i.exec(sql)
    expect(fn).not.toBeNull()
    for (const status of ['draft', 'in_review', 'approved', 'scheduled', 'published', 'archived']) {
      expect(fn![1]).toContain(`'${status}'`)
    }
    expect(fn![1]).toMatch(/errcode = '22023'/)
  })

  it('revokes the default public execute grant on the function', () => {
    expect(sql).toMatch(
      /revoke all on function public\.blog_set_post_status\(uuid, text, timestamptz\) from public/i,
    )
  })

  it('leaves revisions and the audit log read-only to clients', () => {
    // Both are written by the AFTER trigger; an audit trail its subjects can
    // write is not an audit trail.
    expect(sql).toMatch(/create policy blog_post_revisions_read[\s\S]*?for select/i)
    expect(sql).toMatch(/create policy blog_post_audit_log_read[\s\S]*?for select/i)
    expect(sql).not.toMatch(/create policy blog_post_revisions_(insert|write|all)/i)
    expect(sql).not.toMatch(/create policy blog_post_audit_log_(insert|write|all)/i)
  })

  it('gates the audit log on audit.read, not merely blog.read', () => {
    const policy = /create policy blog_post_audit_log_read([\s\S]*?);/i.exec(sql)
    expect(policy![1]).toMatch(/has_capability\('audit\.read'\)/)
  })

  it('preserves the V002 workflow normalization verbatim', () => {
    // The function is redefined wholesale, so a regression here would silently
    // change publish timestamps.
    for (const fragment of [
      "NEW.status := 'published'",
      'NEW.published_at := COALESCE(NEW.published_at, now_ts)',
      'NEW.first_published_at := COALESCE(NEW.first_published_at, NEW.published_at)',
      "IF NEW.status IN ('approved', 'published')",
    ]) {
      expect(sql).toContain(fragment)
    }
  })
})
