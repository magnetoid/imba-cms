import { describe, expect, it } from 'vitest'
import sql from './V001_media.sql?raw'

describe('media V001 migration', () => {
  it('creates the managed media table and policies', () => {
    expect(sql).toMatch(/create table if not exists public\.media_files/i)
    expect(sql).toMatch(/source_type/i)
    expect(sql).toMatch(/media_files_read/i)
    expect(sql).toMatch(/media_files_write/i)
  })
})
