import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedTestConfig } from '../../vitest.shared'

/**
 * Integration tests against a real Postgres.
 *
 * `fileParallelism: false` is required, not tuning: every file calls
 * `resetSchema`, which drops and recreates `public` on the same database, so
 * concurrent files clobber each other mid-run.
 */
export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.int.test.ts'],
      fileParallelism: false,
      testTimeout: 120_000,
      hookTimeout: 120_000,
    },
  }),
)
