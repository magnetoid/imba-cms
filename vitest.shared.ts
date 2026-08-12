import { defineConfig } from 'vitest/config'

/**
 * Shared Vitest config, merged by every package.
 *
 * `maxThreads: 2` is the important line. `turbo run test` starts one Vitest
 * process per package, and each defaults its pool to `os.cpus().length`
 * threads — so eight packages on an eight-core machine can spawn ~64 workers,
 * all building jsdom environments at once. That produced non-deterministic
 * failures in a *different* package on each run (environment setup alone was
 * measured at 68s) against the default 5s test timeout. Capping the pool, and
 * pairing it with `turbo run test --concurrency=4`, bounds total workers.
 *
 * The raised `testTimeout` is belt-and-braces for slow CI hardware, not the fix.
 */
export const sharedTestConfig = defineConfig({
  test: {
    globals: true,
    testTimeout: 15_000,
    hookTimeout: 20_000,
    pool: 'threads',
    poolOptions: { threads: { minThreads: 1, maxThreads: 2 } },
    clearMocks: true,
  },
})

export default sharedTestConfig
