import { describe, it, expect } from 'vitest'
import { definePlugin, defineTemplate } from './define'

describe('define factories', () => {
  it('definePlugin returns the manifest unchanged (identity, typed)', () => {
    const p = definePlugin({ name: 'blog', version: '1.0.0' })
    expect(p).toEqual({ name: 'blog', version: '1.0.0' })
  })

  it('defineTemplate returns the manifest unchanged', () => {
    const Public = () => null
    const t = defineTemplate({ name: 'cinema', layouts: { Public } })
    expect(t.name).toBe('cinema')
    expect(t.layouts.Public).toBe(Public)
  })
})
