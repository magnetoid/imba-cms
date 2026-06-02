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

  const adminPaths = new Set<string>()
  for (const p of plugins) {
    if (!p.admin) continue
    if (adminPaths.has(p.admin.nav.path)) throw new Error(`Duplicate admin path: ${p.admin.nav.path}`)
    adminPaths.add(p.admin.nav.path)
    for (const page of p.admin.pages) {
      if (adminPaths.has(page.path)) throw new Error(`Duplicate admin path: ${page.path}`)
      adminPaths.add(page.path)
    }
  }
}
