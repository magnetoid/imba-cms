import { CORE_MIGRATIONS } from './createCMS'
import { buildRegistry } from './registry'
import type { MigrationDef, Plugin } from './types'

/**
 * The full, ordered migration list for a plugin set — core first, then plugin
 * migrations in dependency-topological order.
 *
 * This is the single source of truth for apply order. `createCMS`,
 * `createAdminApp` and `createPublicApp` all return exactly this list, and the
 * release manifest records it verbatim; the update engine then applies in array
 * order without needing any ordering logic of its own.
 *
 * Kept separate from `createCMS` so tooling can import the composition without
 * pulling in the React router surface.
 */
export function composeMigrations(plugins: Plugin[]): MigrationDef[] {
  return [...CORE_MIGRATIONS, ...buildRegistry(plugins).migrations]
}

export { CORE_MIGRATIONS }
