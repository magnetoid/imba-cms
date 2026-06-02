// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sql = readFileSync(fileURLToPath(new URL('./V001_core.sql', import.meta.url)), 'utf8')

describe('core base migration', () => {
  it('creates schema_migrations, is_admin(), site_settings, cms_settings', () => {
    expect(sql).toMatch(/create table[\s\S]*schema_migrations/i)
    expect(sql).toMatch(/create (or replace )?function is_admin/i)
    expect(sql).toMatch(/site_settings/i)
    expect(sql).toMatch(/cms_settings/i)
  })
})
