// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sqlV001 = readFileSync(fileURLToPath(new URL('./V001_core.sql', import.meta.url)), 'utf8')
const sqlV002 = readFileSync(fileURLToPath(new URL('./V002_core.sql', import.meta.url)), 'utf8')
const sqlV003 = readFileSync(fileURLToPath(new URL('./V003_rbac.sql', import.meta.url)), 'utf8')
const sqlV004 = readFileSync(fileURLToPath(new URL('./V004_feedback.sql', import.meta.url)), 'utf8')
const sqlV005 = readFileSync(fileURLToPath(new URL('./V005_tighten_reads.sql', import.meta.url)), 'utf8')

describe('core base migration', () => {
  it('creates schema_migrations, is_admin(), site_settings, cms_settings', () => {
    expect(sqlV001).toMatch(/create table[\s\S]*schema_migrations/i)
    expect(sqlV001).toMatch(/create (or replace )?function is_admin/i)
    expect(sqlV001).toMatch(/site_settings/i)
    expect(sqlV001).toMatch(/cms_settings/i)
  })

  it('adds private settings storage with admin-only access', () => {
    expect(sqlV002).toMatch(/cms_private_settings/i)
    expect(sqlV002).toMatch(/enable row level security/i)
    expect(sqlV002).toMatch(/cms_private_settings_read/i)
    expect(sqlV002).toMatch(/cms_private_settings_write/i)
  })

  it('adds rbac storage and functions', () => {
    expect(sqlV003).toMatch(/cms_user_roles/i)
    expect(sqlV003).toMatch(/get_current_role/i)
  })

  it('adds feedback storage', () => {
    expect(sqlV004).toMatch(/cms_feedback/i)
    expect(sqlV004).toMatch(/cms_feedback_insert/i)
  })

  it('adds granular rbac tables and functions', () => {
    expect(sqlV003).toMatch(/cms_user_roles/i)
    expect(sqlV003).toMatch(/get_current_role/i)
    expect(sqlV003).toMatch(/has_role/i)
    expect(sqlV003).toMatch(/is_admin/i)
  })

  describe('V005 read tightening', () => {
    it('replaces both anon-readable policies', () => {
      expect(sqlV005).toMatch(/drop policy if exists cms_user_roles_read/i)
      expect(sqlV005).toMatch(/drop policy if exists cms_settings_read/i)
      expect(sqlV005).toMatch(/create policy cms_user_roles_read[\s\S]*auth\.uid\(\)/i)
      expect(sqlV005).toMatch(/create policy cms_settings_read[\s\S]*auth\.uid\(\) is not null/i)
    })

    it('leaves no `using (true)` behind in the recreated policies', () => {
      const recreated = sqlV005.split('\n').filter((line) => /^create policy/i.test(line.trim()))
      expect(recreated.length).toBeGreaterThan(0)
      for (const line of recreated) expect(line).not.toMatch(/using \(true\)/i)
    })

    it('makes the rbac helpers SECURITY DEFINER so the new policies cannot recurse', () => {
      // A policy on cms_user_roles that calls a function reading cms_user_roles
      // re-enters the policy and raises "infinite recursion detected".
      for (const fn of ['get_current_role', 'is_admin', 'has_role']) {
        const pattern = new RegExp(
          `create or replace function ${fn}[\\s\\S]*?security definer[\\s\\S]*?set search_path`,
          'i',
        )
        expect(sqlV005, `${fn} must be security definer with a pinned search_path`).toMatch(pattern)
      }
    })

    it('keeps site_settings publicly readable for the public frontend', () => {
      expect(sqlV005).not.toMatch(/drop policy if exists site_settings_read/i)
    })
  })
})
