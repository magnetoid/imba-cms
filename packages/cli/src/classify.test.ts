import { describe, it, expect } from 'vitest'
import { classifyPackage, inventory, MANAGED_PACKAGES } from './classify.js'

describe('classifyPackage', () => {
  it('classifies every allowlisted package as managed', () => {
    for (const name of MANAGED_PACKAGES) {
      expect(classifyPackage(name)).toBe('managed')
    }
  })

  it('classifies upstream-style @imba/plugin-* and @imba/template-* as managed', () => {
    expect(classifyPackage('@imba/plugin-newsletter')).toBe('managed')
    expect(classifyPackage('@imba/template-portfolio')).toBe('managed')
  })

  it('classifies the consumer app and other packages as local', () => {
    expect(classifyPackage('@acme/website')).toBe('local')
    expect(classifyPackage('apps/imbaproduction')).toBe('local')
    expect(classifyPackage('@imba/tsconfig')).toBe('local')
  })

  it('lets localOverrides flip a managed-looking package to local', () => {
    expect(classifyPackage('@imba/template-cinema', ['@imba/template-cinema'])).toBe('local')
    expect(classifyPackage('@imba/plugin-custom', ['@imba/plugin-custom'])).toBe('local')
  })

  it('localOverrides also wins against the fixed allowlist', () => {
    expect(classifyPackage('@imba/core', ['@imba/core'])).toBe('local')
  })
})

describe('inventory', () => {
  it('splits names into managed and local buckets', () => {
    const result = inventory([
      '@imba/core',
      '@imba/ui',
      '@imba/plugin-blog',
      '@acme/website',
      '@imba/tsconfig',
    ])
    expect(result.managed).toEqual(['@imba/core', '@imba/ui', '@imba/plugin-blog'])
    expect(result.local).toEqual(['@acme/website', '@imba/tsconfig'])
  })

  it('respects localOverrides in the split', () => {
    const result = inventory(
      ['@imba/core', '@imba/template-cinema'],
      ['@imba/template-cinema'],
    )
    expect(result.managed).toEqual(['@imba/core'])
    expect(result.local).toEqual(['@imba/template-cinema'])
  })
})
