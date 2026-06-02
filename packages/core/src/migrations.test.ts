import { describe, it, expect } from 'vitest'
import { orderMigrations } from './migrations'
import type { Plugin } from './types'

const p = (name: string, ids: string[], dependsOn?: string[]): Plugin => ({
  name,
  version: '1.0.0',
  dependsOn,
  migrations: ids.map((id) => ({ id, sql: `-- ${id}` })),
})

describe('orderMigrations', () => {
  it('orders dependencies before dependents', () => {
    const out = orderMigrations([p('import', ['import.V001'], ['blog']), p('blog', ['blog.V001'])])
    expect(out.map((m) => m.id)).toEqual(['blog.V001', 'import.V001'])
  })

  it('sorts a single plugin migrations by id', () => {
    const out = orderMigrations([p('blog', ['blog.V002', 'blog.V001'])])
    expect(out.map((m) => m.id)).toEqual(['blog.V001', 'blog.V002'])
  })

  it('throws on duplicate migration ids across plugins', () => {
    expect(() => orderMigrations([p('a', ['dup.V001']), p('b', ['dup.V001'])])).toThrow(/duplicate migration id: dup\.V001/i)
  })

  it('throws on a dependency cycle', () => {
    expect(() => orderMigrations([p('a', ['a.V001'], ['b']), p('b', ['b.V001'], ['a'])])).toThrow(/cycle/i)
  })
})
