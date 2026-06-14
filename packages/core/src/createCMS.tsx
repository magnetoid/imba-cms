import type { ReactElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { MigrationDef, Plugin, RouteDef, SiteConfig, Template } from './types'
import { buildRegistry } from './registry'
import { createDb } from './db'
import { createAuth } from './auth'
import { AdminShell } from './AdminShell'
import { ThemeProvider } from './theme'
import { useDocumentSeo } from './seo'
import coreV001 from './migrations/V001_core.sql?raw'
import coreV002 from './migrations/V002_core.sql?raw'

// The kernel's own base migration: creates schema_migrations + is_admin() + the
// site/cms settings tables that every plugin's RLS depends on. It must lead the
// composed migration list, so createCMS prepends it.
const CORE_MIGRATIONS: MigrationDef[] = [
  { id: 'core.V001', sql: coreV001 },
  { id: 'core.V002', sql: coreV002 },
]

export interface CMSInstance {
  Router: () => ReactElement
  AdminRouter: () => ReactElement
  PublicRouter: () => ReactElement
  migrations: MigrationDef[]
}

interface CMSConfig {
  template: Template
  plugins: Plugin[]
  site: SiteConfig
  supabase: { url?: string; anonKey: string }
}

interface InitializedCmsRuntime {
  registry: ReturnType<typeof buildRegistry>
  auth: ReturnType<typeof createAuth>
}

function PublicRouteElement({
  route,
  Public,
  site,
}: {
  route: RouteDef
  Public: Template['layouts']['Public']
  site: SiteConfig
}) {
  useDocumentSeo({
    title: route.seo?.title,
    description: route.seo?.description,
    siteName: site.name,
    siteUrl: site.theme?.siteUrl ?? site.domain,
  })

  return (
    <Public>
      <route.element />
    </Public>
  )
}

function initializeCmsRuntime(config: CMSConfig): InitializedCmsRuntime {
  const registry = buildRegistry(config.plugins, config.template)
  const db = createDb({ url: config.supabase.url, anonKey: config.supabase.anonKey })
  const auth = createAuth(db)
  const ctx = { db, auth, config: config.site }

  for (const plugin of registry.orderedPlugins) plugin.register?.(ctx)

  return { registry, auth }
}

export function createAdminApp(config: Omit<CMSConfig, 'template'>) {
  const registry = buildRegistry(config.plugins)
  const db = createDb({ url: config.supabase.url, anonKey: config.supabase.anonKey })
  const auth = createAuth(db)
  const ctx = { db, auth, config: config.site }

  for (const plugin of registry.orderedPlugins) plugin.register?.(ctx)

  function Router() {
    return <AdminShell auth={auth} nav={registry.adminNav} pages={registry.adminPages} widgets={registry.dashboard} />
  }

  return { Router, migrations: [...CORE_MIGRATIONS, ...registry.migrations] }
}

export function createPublicApp(config: CMSConfig) {
  const registry = buildRegistry(config.plugins, config.template)

  const Public = config.template.layouts.Public

  function Router() {
    return (
      <ThemeProvider template={config.template} site={config.site}>
        <Routes>
          {registry.routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<PublicRouteElement route={r} Public={Public} site={config.site} />}
            />
          ))}
        </Routes>
      </ThemeProvider>
    )
  }

  return { Router, migrations: [...CORE_MIGRATIONS, ...registry.migrations] }
}

export function createCMS(config: CMSConfig): CMSInstance {
  const { registry, auth } = initializeCmsRuntime(config)
  const Public = config.template.layouts.Public

  function AdminRouter() {
    return <AdminShell auth={auth} nav={registry.adminNav} pages={registry.adminPages} widgets={registry.dashboard} />
  }

  function PublicRouter() {
    return (
      <ThemeProvider template={config.template} site={config.site}>
        <Routes>
          {registry.routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<PublicRouteElement route={r} Public={Public} site={config.site} />}
            />
          ))}
        </Routes>
      </ThemeProvider>
    )
  }

  function Router() {
    return (
      <ThemeProvider template={config.template} site={config.site}>
        <Routes>
          <Route path="/admin/*" element={<AdminRouter />} />
          {registry.routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<PublicRouteElement route={r} Public={Public} site={config.site} />}
            />
          ))}
        </Routes>
      </ThemeProvider>
    )
  }

  return { Router, AdminRouter, PublicRouter, migrations: [...CORE_MIGRATIONS, ...registry.migrations] }
}
