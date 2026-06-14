import { describe, expect, it } from 'vitest'
import settings from './index'

describe('@imba/plugin-settings manifest', () => {
  it('registers settings admin pages and a dashboard widget', () => {
    expect(settings.name).toBe('settings')
    expect(settings.admin?.nav.path).toBe('/admin/settings')
    expect(settings.admin?.pages.map((page) => page.path)).toEqual([
      '/admin/settings',
      '/admin/settings/graphql',
      '/admin/settings/mcp',
    ])
    expect(settings.dashboard?.map((widget) => widget.id)).toEqual(['settings-overview'])
  })
})
