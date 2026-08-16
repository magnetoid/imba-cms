import { describe, expect, it } from 'vitest'
import i18next from 'i18next'
import { initI18n } from './i18n'

describe('initI18n', () => {
  it('initialises i18next with plugin-namespaced resources', () => {
    initI18n({ defaultLocale: 'en', resources: { en: { blog: { title: 'Blog' } } } })
    expect(i18next.t('title', { ns: 'blog' })).toBe('Blog')
  })

  it('is safe to call again: merges new bundles instead of re-initialising', () => {
    // Every createCMS / createAdminApp / createPublicApp call goes through this,
    // and the admin app and public app may both boot in one process (tests do).
    // i18next is a singleton, so a second init() would warn and drop the first
    // bundle set; the second call must add to it.
    initI18n({ defaultLocale: 'en', resources: { en: { blog: { title: 'Blog' } } } })
    initI18n({ defaultLocale: 'en', resources: { en: { pages: { title: 'Pages' } } } })
    expect(i18next.t('title', { ns: 'blog' })).toBe('Blog')
    expect(i18next.t('title', { ns: 'pages' })).toBe('Pages')
  })

  it('switches the active language to the requested default locale', () => {
    initI18n({ defaultLocale: 'sr', resources: { sr: { blog: { title: 'Blog (sr)' } } } })
    expect(i18next.language).toBe('sr')
    expect(i18next.t('title', { ns: 'blog' })).toBe('Blog (sr)')
  })
})
