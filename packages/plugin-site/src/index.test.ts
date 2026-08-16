// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { PluginContext } from '@imba/core'
import site from './index'
import { DEFAULT_SITE_SETTINGS_CONTENT, buildSiteThemeConfig } from './defaults'
import { setSitePublicClient } from './public/siteClient'

const ctx = {} as PluginContext

describe('plugin-site resolveTheme', () => {
  it('maps the published settings row onto the theme config the templates read', async () => {
    // buildSiteThemeConfig existed and mapped settings → ThemeConfig, but no
    // code path ever called it: editors could publish nav/footer/brand changes
    // that no public page displayed. This is the wire.
    setSitePublicClient({
      getPublishedSiteSettings: vi.fn().mockResolvedValue({
        id: '1', slug: 'primary', title: 'Public Site', status: 'published',
        content: { ...DEFAULT_SITE_SETTINGS_CONTENT, brand: { ...DEFAULT_SITE_SETTINGS_CONTENT.brand, name: 'Published Brand' } },
      }),
    })
    const theme = await site.resolveTheme!(ctx)
    expect(theme?.brand?.name).toBe('Published Brand')
    expect(theme).toEqual(buildSiteThemeConfig({
      ...DEFAULT_SITE_SETTINGS_CONTENT,
      brand: { ...DEFAULT_SITE_SETTINGS_CONTENT.brand, name: 'Published Brand' },
    }))
  })

  it('contributes nothing when no settings row is published, so template defaults hold', async () => {
    setSitePublicClient({ getPublishedSiteSettings: vi.fn().mockResolvedValue(null) })
    expect(await site.resolveTheme!(ctx)).toBeUndefined()
  })
})
