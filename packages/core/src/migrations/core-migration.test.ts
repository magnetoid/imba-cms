// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sqlV001 = readFileSync(fileURLToPath(new URL('./V001_core.sql', import.meta.url)), 'utf8')
const sqlV002 = readFileSync(fileURLToPath(new URL('./V002_core.sql', import.meta.url)), 'utf8')

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
})
