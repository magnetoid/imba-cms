import { describe, expect, it } from 'vitest'
import media from './index'

describe('@imba/plugin-media manifest', () => {
  it('declares the media admin module and migration', () => {
    expect(media.name).toBe('media')
    expect(media.tablePrefix).toBe('media_')
    expect(media.admin?.nav.path).toBe('/admin/media')
    expect(media.migrations?.[0].id).toBe('media.V001')
  })
})
