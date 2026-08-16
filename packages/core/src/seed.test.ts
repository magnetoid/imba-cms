import { describe, expect, it, vi } from 'vitest'
import { seedPlugins, seedablePlugins } from './seed'
import { definePlugin } from './define'
import type { PluginContext } from './types'

const ctx = { db: {}, auth: {}, config: { name: 't', domain: 't', defaultLocale: 'en', locales: ['en'] } } as unknown as PluginContext

describe('seedPlugins', () => {
  it('runs each plugin seed in the given order and reports success per plugin', async () => {
    const calls: string[] = []
    const plugins = [
      definePlugin({ name: 'a', version: '1', seed: async () => { calls.push('a') } }),
      definePlugin({ name: 'b', version: '1' }),
      definePlugin({ name: 'c', version: '1', seed: async () => { calls.push('c') } }),
    ]
    const results = await seedPlugins(plugins, ctx)
    expect(calls).toEqual(['a', 'c'])
    expect(results).toEqual([
      { plugin: 'a', status: 'seeded' },
      { plugin: 'c', status: 'seeded' },
    ])
  })

  it('records a failure and continues with the remaining plugins', async () => {
    const after = vi.fn()
    const results = await seedPlugins([
      definePlugin({ name: 'boom', version: '1', seed: async () => { throw new Error('rls denied') } }),
      definePlugin({ name: 'after', version: '1', seed: after }),
    ], ctx)
    expect(after).toHaveBeenCalledOnce()
    expect(results[0]).toEqual({ plugin: 'boom', status: 'failed', error: 'rls denied' })
    expect(results[1]).toEqual({ plugin: 'after', status: 'seeded' })
  })

  it('can be limited to a subset of plugins', async () => {
    const a = vi.fn(), b = vi.fn()
    await seedPlugins([
      definePlugin({ name: 'a', version: '1', seed: a }),
      definePlugin({ name: 'b', version: '1', seed: b }),
    ], ctx, { only: ['b'] })
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledOnce()
  })

  it('lists the plugins that have a seed hook', () => {
    expect(seedablePlugins([
      definePlugin({ name: 'a', version: '1', seed: async () => {} }),
      definePlugin({ name: 'b', version: '1' }),
    ])).toEqual(['a'])
  })
})
