import { describe, expect, it } from 'vitest'
import { CmsConfigError, assertValidCmsConfig } from './config'

const site = {
  name: 'Test Site',
  domain: 'example.com',
  defaultLocale: 'en',
  locales: ['en'],
}

const valid = {
  plugins: [{ name: 'blog', version: '1.0.0' }],
  site,
  supabase: { url: 'https://project.supabase.co', anonKey: 'anon-key' },
}

describe('assertValidCmsConfig', () => {
  it('accepts a complete configuration', () => {
    expect(() => assertValidCmsConfig(valid)).not.toThrow()
  })

  it('accepts an empty plugin list', () => {
    expect(() => assertValidCmsConfig({ ...valid, plugins: [] })).not.toThrow()
  })

  it('rejects a missing anon key instead of substituting a placeholder', () => {
    // Regression: this used to become the literal key 'placeholder', surfacing
    // as a confusing 401 on the first query rather than a boot failure.
    expect(() => assertValidCmsConfig({ ...valid, supabase: { url: valid.supabase.url, anonKey: '' } }))
      .toThrow(/supabase\.anonKey is required/)
  })

  it('rejects a missing url instead of silently proxying via the origin', () => {
    expect(() => assertValidCmsConfig({ ...valid, supabase: { anonKey: 'k' } })).toThrow(
      /supabase\.url is required/,
    )
  })

  it('treats a placeholder url as missing', () => {
    expect(() =>
      assertValidCmsConfig({ ...valid, supabase: { url: 'http://placeholder', anonKey: 'k' } }),
    ).toThrow(/supabase\.url is required/)
  })

  it('allows the origin proxy when opted into explicitly', () => {
    expect(() =>
      assertValidCmsConfig({ ...valid, supabase: { anonKey: 'k', allowOriginProxy: true } }),
    ).not.toThrow()
  })

  it('rejects a malformed url', () => {
    expect(() =>
      assertValidCmsConfig({ ...valid, supabase: { url: 'not-a-url', anonKey: 'k' } }),
    ).toThrow(/not a valid absolute URL/)
  })

  it('requires the site identity fields', () => {
    expect(() => assertValidCmsConfig({ ...valid, site: { ...site, name: '  ' } })).toThrow(
      /site\.name is required/,
    )
    expect(() => assertValidCmsConfig({ ...valid, site: { ...site, domain: '' } })).toThrow(
      /site\.domain is required/,
    )
  })

  it('catches a defaultLocale that is not among the locales', () => {
    expect(() =>
      assertValidCmsConfig({ ...valid, site: { ...site, defaultLocale: 'sr', locales: ['en'] } }),
    ).toThrow(/defaultLocale "sr" is not in site\.locales/)
  })

  it('requires each plugin to carry a name and version', () => {
    expect(() => assertValidCmsConfig({ ...valid, plugins: [{ name: 'blog' }] })).toThrow(
      /version/,
    )
  })

  it('reports every problem at once', () => {
    try {
      assertValidCmsConfig({
        plugins: [],
        site: { ...site, name: '', domain: '' },
        supabase: { anonKey: '' },
      })
      throw new Error('expected assertValidCmsConfig to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(CmsConfigError)
      const { issues } = error as CmsConfigError
      expect(issues.length).toBeGreaterThanOrEqual(3)
      expect(issues.join('\n')).toMatch(/site\.name/)
      expect(issues.join('\n')).toMatch(/site\.domain/)
      expect(issues.join('\n')).toMatch(/anonKey/)
    }
  })
})
