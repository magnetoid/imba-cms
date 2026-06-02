import type { MigrationDef, Plugin } from './types'

export function orderMigrations(plugins: Plugin[]): MigrationDef[] {
  // Topological sort of plugins by dependsOn (Kahn's algorithm).
  const byName = new Map(plugins.map((p) => [p.name, p]))
  const indegree = new Map<string, number>(plugins.map((p) => [p.name, 0]))
  const dependents = new Map<string, string[]>(plugins.map((p) => [p.name, []]))

  for (const p of plugins) {
    for (const dep of p.dependsOn ?? []) {
      if (!byName.has(dep)) continue // missing deps are caught by validatePlugins
      indegree.set(p.name, (indegree.get(p.name) ?? 0) + 1)
      dependents.get(dep)!.push(p.name)
    }
  }

  const queue = [...indegree.entries()].filter(([, d]) => d === 0).map(([n]) => n).sort()
  const order: string[] = []
  while (queue.length) {
    const name = queue.shift()!
    order.push(name)
    for (const child of dependents.get(name)!.sort()) {
      indegree.set(child, indegree.get(child)! - 1)
      if (indegree.get(child) === 0) queue.push(child)
    }
    queue.sort()
  }
  if (order.length !== plugins.length) throw new Error('Migration ordering failed: dependency cycle detected')

  const seen = new Set<string>()
  const result: MigrationDef[] = []
  for (const name of order) {
    const migrations = [...(byName.get(name)!.migrations ?? [])].sort((a, b) => a.id.localeCompare(b.id))
    for (const m of migrations) {
      if (seen.has(m.id)) throw new Error(`Duplicate migration id: ${m.id}`)
      seen.add(m.id)
      result.push(m)
    }
  }
  return result
}
