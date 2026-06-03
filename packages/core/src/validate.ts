import type { Plugin } from './types'

export function validatePlugins(plugins: Plugin[]): void {
  const names = new Set<string>()
  for (const p of plugins) {
    if (names.has(p.name)) throw new Error(`Duplicate plugin name: ${p.name}`)
    names.add(p.name)
  }

  for (const p of plugins) {
    for (const dep of p.dependsOn ?? []) {
      if (!names.has(dep)) throw new Error(`Plugin "${p.name}" depends on "${dep}", which is not registered`)
    }
  }

  const prefixes = new Map<string, string>()
  for (const p of plugins) {
    if (!p.tablePrefix) continue
    const owner = prefixes.get(p.tablePrefix)
    if (owner) throw new Error(`tablePrefix collision: ${p.tablePrefix} used by "${owner}" and "${p.name}"`)
    prefixes.set(p.tablePrefix, p.name)
  }

  const routePaths = new Set<string>()
  for (const p of plugins) {
    for (const r of p.routes ?? []) {
      if (routePaths.has(r.path)) throw new Error(`Duplicate route path: ${r.path}`)
      routePaths.add(r.path)
    }
  }

  // Nav paths and page paths are separate namespaces: a nav item legitimately
  // points at its own landing page (same path), so they must not collide-check
  // against each other. Reject only duplicate nav paths or duplicate page paths.
  const adminNavPaths = new Set<string>()
  const adminPagePaths = new Set<string>()
  for (const p of plugins) {
    if (!p.admin) continue
    if (adminNavPaths.has(p.admin.nav.path)) throw new Error(`Duplicate admin nav path: ${p.admin.nav.path}`)
    adminNavPaths.add(p.admin.nav.path)
    for (const page of p.admin.pages) {
      if (adminPagePaths.has(page.path)) throw new Error(`Duplicate admin page path: ${page.path}`)
      adminPagePaths.add(page.path)
    }
  }
}
