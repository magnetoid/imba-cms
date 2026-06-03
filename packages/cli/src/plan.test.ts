import { describe, it, expect } from 'vitest'
import { planUpdate } from './plan.js'

const managed = [
  { id: 'core.V001', sql: 'CREATE TABLE pages (id uuid primary key);' },
  { id: 'blog.V001', sql: 'ALTER TABLE posts ADD COLUMN slug text;' },
  { id: 'blog.V002', sql: 'CREATE TABLE comments (id uuid primary key);' },
]

describe('planUpdate', () => {
  it('computes pending from applied ids', () => {
    const plan = planUpdate({
      current: 'v1.0.0',
      target: 'v1.1.0',
      managedMigrations: managed,
      appliedIds: ['core.V001'],
    })
    expect(plan.pending.map((m) => m.id)).toEqual(['blog.V001', 'blog.V002'])
    expect(plan.from).toBe('v1.0.0')
    expect(plan.to).toBe('v1.1.0')
  })

  it('has no destructive entries and is not blocked for additive migrations', () => {
    const plan = planUpdate({
      current: 'v1.0.0',
      target: 'v1.1.0',
      managedMigrations: managed,
      appliedIds: [],
    })
    expect(plan.destructive).toEqual([])
    expect(plan.blocked).toBe(false)
  })

  it('populates destructive and sets blocked when a pending migration is destructive', () => {
    const plan = planUpdate({
      current: 'v1.0.0',
      target: 'v1.1.0',
      managedMigrations: [
        ...managed,
        { id: 'blog.V003', sql: 'DROP TABLE comments;' },
      ],
      appliedIds: ['core.V001', 'blog.V001', 'blog.V002'],
    })
    expect(plan.pending.map((m) => m.id)).toEqual(['blog.V003'])
    expect(plan.destructive).toEqual([{ id: 'blog.V003', reasons: ['DROP TABLE'] }])
    expect(plan.blocked).toBe(true)
  })

  it('does not flag an already-applied destructive migration', () => {
    const plan = planUpdate({
      current: 'v1.0.0',
      target: 'v1.1.0',
      managedMigrations: [{ id: 'blog.V003', sql: 'DROP TABLE comments;' }],
      appliedIds: ['blog.V003'],
    })
    expect(plan.pending).toEqual([])
    expect(plan.blocked).toBe(false)
  })

  it('sets upToDate when current > target', () => {
    const plan = planUpdate({
      current: 'v2.0.0',
      target: 'v1.5.0',
      managedMigrations: managed,
      appliedIds: [],
    })
    expect(plan.upToDate).toBe(true)
  })

  it('sets upToDate when current === target', () => {
    const plan = planUpdate({
      current: 'v1.2.0',
      target: 'v1.2.0',
      managedMigrations: managed,
      appliedIds: [],
    })
    expect(plan.upToDate).toBe(true)
  })

  it('is not upToDate when current < target', () => {
    const plan = planUpdate({
      current: 'v1.0.0',
      target: 'v1.2.0',
      managedMigrations: managed,
      appliedIds: [],
    })
    expect(plan.upToDate).toBe(false)
  })
})
