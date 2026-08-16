import type { Locale, MigrationDef, NavItem, Plugin, PluginContext, RouteDef, Template, ThemeConfig, WidgetDef } from './types'
import { validatePlugins } from './validate'
import { orderMigrations, orderPlugins } from './migrations'

export interface CMSRegistry {
  routes: RouteDef[]
  adminNav: NavItem[]
  adminPages: RouteDef[]
  migrations: MigrationDef[]
  dashboard: WidgetDef[]
  orderedPlugins: Plugin[]
  /**
   * `{ [locale]: { [pluginName]: strings } }` — every plugin's `i18n` block,
   * namespaced by plugin name so two plugins can both define `title` without
   * clobbering each other. Fed to `initI18n` by the boot path.
   */
  i18n: I18nResources
  /** Every plugin `resolveTheme` hook, in dependency order. */
  themeResolvers: ThemeResolverEntry[]
}

export interface ThemeResolverEntry {
  plugin: string
  resolve: (ctx: PluginContext) => Promise<ThemeConfig | undefined>
}

export type I18nResources = Record<Locale, Record<string, Record<string, string>>>

export function collectI18nResources(plugins: Plugin[]): I18nResources {
  const resources: I18nResources = {}
  for (const plugin of plugins) {
    for (const [locale, strings] of Object.entries(plugin.i18n ?? {})) {
      resources[locale] ??= {}
      resources[locale][plugin.name] = strings
    }
  }
  return resources
}

export function buildRegistry(plugins: Plugin[], template?: Template): CMSRegistry {
  validatePlugins(plugins)
  const orderedPlugins = orderPlugins(plugins)

  if (template?.expects?.length) {
    const pluginNames = new Set(plugins.map((plugin) => plugin.name))
    for (const expectedPlugin of template.expects) {
      if (!pluginNames.has(expectedPlugin)) {
        throw new Error(`Template "${template.name}" expects plugin "${expectedPlugin}", which is not registered`)
      }
    }
  }

  if (template) {
    const templatePaths = new Set((template.pages ?? []).map((p) => p.path))
    for (const p of plugins) {
      for (const r of p.routes ?? []) {
        if (templatePaths.has(r.path)) throw new Error(`Plugin "${p.name}" route path collides with template: ${r.path}`)
      }
    }
  }

  const routes: RouteDef[] = [...(template?.pages ?? []), ...plugins.flatMap((p) => p.routes ?? [])]
  const adminNav: NavItem[] = plugins.filter((p) => p.admin).map((p) => p.admin!.nav)
  const adminPages: RouteDef[] = plugins.flatMap((p) => p.admin?.pages ?? [])
  const dashboard: WidgetDef[] = plugins.flatMap((p) => p.dashboard ?? [])
  const migrations = orderMigrations(orderedPlugins)
  const i18n = collectI18nResources(orderedPlugins)
  const themeResolvers: ThemeResolverEntry[] = orderedPlugins
    .filter((p) => typeof p.resolveTheme === 'function')
    .map((p) => ({ plugin: p.name, resolve: p.resolveTheme! }))

  return { routes, adminNav, adminPages, migrations, dashboard, orderedPlugins, i18n, themeResolvers }
}
