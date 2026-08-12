import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedTestConfig } from '../../vitest.shared'

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
  }),
)
