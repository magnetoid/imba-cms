import { describe, it, expect } from 'vitest'
import * as core from './index'

describe('@imba/core public API', () => {
  it('exports the documented surface', () => {
    for (const name of ['definePlugin', 'defineTemplate', 'createCMS', 'createDb', 'createAuth', 'buildRegistry', 'orderMigrations', 'validatePlugins', 'initI18n']) {
      expect(typeof (core as Record<string, unknown>)[name]).toBe('function')
    }
  })
})
