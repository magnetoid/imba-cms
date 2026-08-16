// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { PluginContext } from '@imba/core'
import pages from './index'
import { buildDefaultPageRecord } from './defaults'
import { setPagesPublicClient } from './public/pagesClient'

const ctx = {} as PluginContext

describe('plugin-pages resolveTheme', () => {
  it('maps the published home page onto the theme hero', async () => {
    const home = buildDefaultPageRecord('home')
    setPagesPublicClient({
      getPage: vi.fn().mockResolvedValue({ ...home, status: 'published' }),
      listPages: vi.fn(),
    })
    const theme = await pages.resolveTheme!(ctx)
    expect(theme?.home?.hero).toEqual({
      eyebrow: home.content.eyebrow,
      title: home.content.title,
      lead: home.content.subtitle,
      primaryAction: home.content.primaryAction,
      secondaryAction: home.content.secondaryAction,
    })
  })

  it('ignores a draft home page and a missing one', async () => {
    const home = buildDefaultPageRecord('home')
    setPagesPublicClient({ getPage: vi.fn().mockResolvedValue({ ...home, status: 'draft' }), listPages: vi.fn() })
    expect(await pages.resolveTheme!(ctx)).toBeUndefined()
    setPagesPublicClient({ getPage: vi.fn().mockResolvedValue(null), listPages: vi.fn() })
    expect(await pages.resolveTheme!(ctx)).toBeUndefined()
  })
})
