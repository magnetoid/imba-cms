import { describe, it, expect } from 'vitest'
import { validatePlugins } from './validate'
import type { Plugin } from './types'

const Page = () => null
const base = (over: Partial<Plugin>): Plugin => ({ name: 'x', version: '1.0.0', ...over })

describe('validatePlugins', () => {
  it('passes for a valid, non-conflicting set', () => {
    expect(() =>
      validatePlugins([
        base({ name: 'blog', tablePrefix: 'blog_', routes: [{ path: '/blog', element: Page }] }),
        base({ name: 'shop', tablePrefix: 'shop_', routes: [{ path: '/shop', element: Page }] }),
      ]),
    ).not.toThrow()
  })

  it('throws on duplicate plugin names', () => {
    expect(() => validatePlugins([base({ name: 'blog' }), base({ name: 'blog' })])).toThrow(/duplicate plugin name: blog/i)
  })

  it('throws on a missing dependsOn target', () => {
    expect(() => validatePlugins([base({ name: 'import', dependsOn: ['blog'] })])).toThrow(/import.*depends on.*blog/i)
  })

  it('throws on tablePrefix collision', () => {
    expect(() =>
      validatePlugins([base({ name: 'a', tablePrefix: 'shared_' }), base({ name: 'b', tablePrefix: 'shared_' })]),
    ).toThrow(/tableprefix collision: shared_/i)
  })

  it('throws on duplicate public route paths', () => {
    expect(() =>
      validatePlugins([
        base({ name: 'a', routes: [{ path: '/dup', element: Page }] }),
        base({ name: 'b', routes: [{ path: '/dup', element: Page }] }),
      ]),
    ).toThrow(/duplicate route path: \/dup/i)
  })

  it('throws on duplicate admin nav paths', () => {
    const admin = (p: string) => ({ nav: { group: 'G', label: 'L', path: p }, pages: [] })
    expect(() =>
      validatePlugins([base({ name: 'a', admin: admin('/admin/dup') }), base({ name: 'b', admin: admin('/admin/dup') })]),
    ).toThrow(/duplicate admin path: \/admin\/dup/i)
  })
})
