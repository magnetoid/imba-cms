import type { Plugin, PluginContext } from './types'

export interface SeedResult {
  plugin: string
  status: 'seeded' | 'failed'
  error?: string
}

export interface SeedOptions {
  /** Restrict the run to these plugin names. Default: every plugin with a `seed`. */
  only?: readonly string[]
}

/** Names of the plugins that declare a `seed` hook, in the given order. */
export function seedablePlugins(plugins: readonly Plugin[]): string[] {
  return plugins.filter((p) => typeof p.seed === 'function').map((p) => p.name)
}

/**
 * Runs each plugin's `seed(ctx)` in the order given (callers pass the
 * dependency-ordered list from the registry, so a plugin's seed sees the rows
 * its dependencies inserted).
 *
 * `Plugin.seed` was on the contract from the start and pages, projects, site and
 * blog all implemented it, but nothing in core ever called one — a fresh install
 * had a schema and no content. This is the missing runner.
 *
 * Failures are recorded and do not stop the run: seeds are idempotent by
 * convention (each checks for existing rows), and one plugin's RLS rejection —
 * the usual failure — should not hide whether the others succeeded. The result
 * list is what the admin's setup panel renders.
 */
export async function seedPlugins(
  plugins: readonly Plugin[],
  ctx: PluginContext,
  opts: SeedOptions = {},
): Promise<SeedResult[]> {
  const only = opts.only ? new Set(opts.only) : null
  const results: SeedResult[] = []

  for (const plugin of plugins) {
    if (!plugin.seed) continue
    if (only && !only.has(plugin.name)) continue
    try {
      await plugin.seed(ctx)
      results.push({ plugin: plugin.name, status: 'seeded' })
    } catch (error) {
      results.push({
        plugin: plugin.name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}
