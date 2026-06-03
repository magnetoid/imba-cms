import { describe, it, expect } from 'vitest'
import { runUpdate, type UpdateIO } from './update.js'
import type { MigrationLike } from './safety.js'

interface FakeOptions {
  current?: string
  tags?: string[]
  managedMigrations?: MigrationLike[]
  appliedIds?: string[]
}

/**
 * A recording fake IO. `calls` is an ordered log of every side-effecting method
 * invoked, so tests can both assert ORDER and assert ABSENCE (proving an update
 * never mutates managed state in the blocked/dry-run/up-to-date paths).
 */
function makeFakeIO(opts: FakeOptions = {}) {
  const calls: string[] = []
  const io: UpdateIO = {
    async listTags() {
      return opts.tags ?? ['v1.0.0', 'v1.1.0', 'v2.0.0']
    },
    async currentVersion() {
      return opts.current ?? 'v1.0.0'
    },
    async collectManagedMigrations() {
      return opts.managedMigrations ?? []
    },
    async appliedMigrationIds() {
      return opts.appliedIds ?? []
    },
    async checkout(tag: string) {
      calls.push(`checkout:${tag}`)
    },
    async install() {
      calls.push('install')
    },
    async applyMigrations(pending) {
      calls.push(`applyMigrations:${pending.map((m) => m.id).join(',')}`)
      return pending.map((m) => m.id)
    },
    async writeVersion(tag: string) {
      calls.push(`writeVersion:${tag}`)
    },
    log() {
      // swallow logs in tests
    },
  }
  return { io, calls }
}

const additive: MigrationLike[] = [
  { id: 'core.V001', sql: 'CREATE TABLE pages (id uuid primary key);' },
  { id: 'blog.V001', sql: 'ALTER TABLE posts ADD COLUMN slug text;' },
]

describe('runUpdate — happy path (additive)', () => {
  it('checks out, installs, applies migrations, writes version in order; returns updated:true', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v1.0.0',
      tags: ['v1.0.0', 'v1.1.0'],
      managedMigrations: additive,
      appliedIds: [],
    })

    const result = await runUpdate({}, io)

    expect(result.updated).toBe(true)
    expect(result.from).toBe('v1.0.0')
    expect(result.to).toBe('v1.1.0') // resolved to latest tag
    expect(result.appliedMigrationIds).toEqual(['core.V001', 'blog.V001'])
    expect(calls).toEqual([
      'checkout:v1.1.0',
      'install',
      'applyMigrations:core.V001,blog.V001',
      'writeVersion:v1.1.0',
    ])
  })

  it('respects an explicit --to target', async () => {
    const { io } = makeFakeIO({
      current: 'v1.0.0',
      tags: ['v1.0.0', 'v1.1.0', 'v2.0.0'],
      managedMigrations: additive,
      appliedIds: [],
    })
    const result = await runUpdate({ to: 'v1.1.0' }, io)
    expect(result.to).toBe('v1.1.0')
    expect(result.updated).toBe(true)
  })
})

describe('runUpdate — destructive pending without --force', () => {
  it('returns blockedBy and NEVER touches managed state', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v1.0.0',
      tags: ['v1.0.0', 'v1.1.0'],
      managedMigrations: [{ id: 'blog.V002', sql: 'DROP TABLE posts;' }],
      appliedIds: [],
    })

    const result = await runUpdate({}, io)

    expect(result.updated).toBe(false)
    expect(result.blockedBy).toEqual([{ id: 'blog.V002', reasons: ['DROP TABLE'] }])
    // Nothing mutating was called — proves "never overwrites".
    expect(calls).toEqual([])
  })

  it('proceeds (and applies) when --force is set', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v1.0.0',
      tags: ['v1.0.0', 'v1.1.0'],
      managedMigrations: [{ id: 'blog.V002', sql: 'DROP TABLE posts;' }],
      appliedIds: [],
    })

    const result = await runUpdate({ force: true }, io)

    expect(result.updated).toBe(true)
    expect(result.blockedBy).toBeUndefined()
    expect(calls).toEqual([
      'checkout:v1.1.0',
      'install',
      'applyMigrations:blog.V002',
      'writeVersion:v1.1.0',
    ])
  })
})

describe('runUpdate — dry run', () => {
  it('returns updated:false and calls nothing mutating', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v1.0.0',
      tags: ['v1.0.0', 'v1.1.0'],
      managedMigrations: additive,
      appliedIds: [],
    })

    const result = await runUpdate({ dryRun: true }, io)

    expect(result.updated).toBe(false)
    expect(calls).toEqual([])
  })
})

describe('runUpdate — already up to date', () => {
  it('returns updated:false and calls nothing when current >= target', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v2.0.0',
      tags: ['v1.0.0', 'v1.1.0', 'v2.0.0'],
      managedMigrations: additive,
      appliedIds: [],
    })

    const result = await runUpdate({}, io)

    expect(result.updated).toBe(false)
    expect(calls).toEqual([])
  })

  it('is up to date when explicit --to equals current', async () => {
    const { io, calls } = makeFakeIO({
      current: 'v1.1.0',
      tags: ['v1.0.0', 'v1.1.0', 'v2.0.0'],
      managedMigrations: additive,
      appliedIds: [],
    })
    const result = await runUpdate({ to: 'v1.1.0' }, io)
    expect(result.updated).toBe(false)
    expect(calls).toEqual([])
  })
})
