import { describe, it, expect } from 'vitest'
import { planMigrations } from './migrate'
import type { MigrationDef } from '../types'

const all: MigrationDef[] = [
  { id: 'core.V001', sql: '-- core' },
  { id: 'blog.V001', sql: '-- blog' },
]

describe('planMigrations', () => {
  it('returns only migrations not yet recorded as applied', () => {
    const pending = planMigrations(all, ['core.V001'])
    expect(pending.map((m) => m.id)).toEqual(['blog.V001'])
  })

  it('returns all when nothing is applied', () => {
    expect(planMigrations(all, []).map((m) => m.id)).toEqual(['core.V001', 'blog.V001'])
  })
})
