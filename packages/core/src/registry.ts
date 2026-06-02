import type { MigrationDef, NavItem, Plugin, RouteDef, Template, WidgetDef } from './types'
import { validatePlugins } from './validate'
import { orderMigrations } from './migrations'

export interface CMSRegistry {
  routes: RouteDef[]
  adminNav: NavItem[]
  adminPages: RouteDef[]
  migrations: MigrationDef[]
  dashboard: WidgetDef[]
}

export function buildRegistry(plugins: Plugin[], template: Template): CMSRegistry {
  validatePlugins(plugins)

  const templatePaths = new Set((template.pages ?? []).map((p) => p.path))
  for (const p of plugins) {
    for (const r of p.routes ?? []) {
      if (templatePaths.has(r.path)) throw new Error(`Plugin "${p.name}" route path collides with template: ${r.path}`)
    }
  }

  const routes: RouteDef[] = [...(template.pages ?? []), ...plugins.flatMap((p) => p.routes ?? [])]
  const adminNav: NavItem[] = plugins.filter((p) => p.admin).map((p) => p.admin!.nav)
  const adminPages: RouteDef[] = plugins.flatMap((p) => p.admin?.pages ?? [])
  const dashboard: WidgetDef[] = plugins.flatMap((p) => p.dashboard ?? [])
  const migrations = orderMigrations(plugins)

  return { routes, adminNav, adminPages, migrations, dashboard }
}
