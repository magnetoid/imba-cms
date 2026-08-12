import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedTestConfig } from '../../vitest.shared'

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    // Integration specs live behind vitest.int.config.ts; the default run is
    // deliberately empty so `pnpm test` never needs a database.
    test: { environment: 'node', include: ['src/**/*.test.ts'], exclude: ['**/*.int.test.ts'] },
  }),
)
