/**
 * Package classification: which packages are MANAGED (owned by IMBA-CMS and
 * therefore updatable) versus LOCAL (the consumer's own code — never touched
 * by an update).
 *
 * Managed:
 *   - the fixed allowlist below, plus
 *   - any `@imba/plugin-*` / `@imba/template-*` (upstream naming convention),
 *     UNLESS the name appears in the caller's `localOverrides`.
 *
 * Local:
 *   - everything else: the consumer's app(s), their own template/plugin
 *     packages, and any managed-looking name they explicitly override as local.
 */

export const MANAGED_PACKAGES: readonly string[] = [
  '@imba/core',
  '@imba/ui',
  '@imba/tailwind-preset',
  '@imba/plugin-blog',
  '@imba/plugin-mcp',
  '@imba/template-cinema',
]

// Upstream-style managed packages follow @imba/plugin-* or @imba/template-*.
const MANAGED_PATTERN = /^@imba\/(plugin|template)-/

export type Classification = 'managed' | 'local'

/**
 * Classify a single package name as 'managed' or 'local'.
 *
 * A name is managed when it is in MANAGED_PACKAGES, OR it matches the
 * `@imba/plugin-`/`@imba/template-` pattern — UNLESS it is listed in
 * `localOverrides`, which always forces it to 'local'.
 */
export function classifyPackage(name: string, localOverrides: string[] = []): Classification {
  if (localOverrides.includes(name)) return 'local'
  if (MANAGED_PACKAGES.includes(name)) return 'managed'
  if (MANAGED_PATTERN.test(name)) return 'managed'
  return 'local'
}

export interface Inventory {
  managed: string[]
  local: string[]
}

/**
 * Split a list of package names into managed / local buckets.
 */
export function inventory(pkgNames: string[], localOverrides: string[] = []): Inventory {
  const managed: string[] = []
  const local: string[] = []
  for (const name of pkgNames) {
    if (classifyPackage(name, localOverrides) === 'managed') managed.push(name)
    else local.push(name)
  }
  return { managed, local }
}
