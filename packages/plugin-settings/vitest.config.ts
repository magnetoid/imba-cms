import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedTestConfig } from '../../vitest.shared'

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    esbuild: { jsxInject: `import React from 'react'` },
    test: { environment: 'jsdom' },
  }),
)
