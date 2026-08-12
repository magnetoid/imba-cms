import { Suspense, type ReactElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { MigrationDef, Plugin, RouteDef, SiteConfig, Template } from './types'
import { buildRegistry } from './registry'
import { assertValidCmsConfig } from './config'
import { createDb } from './db'
import { createAuth } from './auth'
import { AdminShell } from './AdminShell'
import { ThemeProvider } from './theme'
import { useDocumentSeo } from './seo'
import coreV001 from './migrations/V001_core.sql?raw'
import coreV002 from './migrations/V002_core.sql?raw'
import coreV003 from './migrations/V003_rbac.sql?raw'
import coreV004 from './migrations/V004_feedback.sql?raw'
import coreV005 from './migrations/V005_tighten_reads.sql?raw'

// The kernel's own base migration: creates schema_migrations + is_admin() + the
// site/cms settings tables that every plugin's RLS depends on. It must lead the
// composed migration list, so createCMS prepends it.
//
// Exported because the release-manifest generator and the migration test
// harness need the same ordered list the running app composes — deriving it
// from a filesystem glob instead would silently disagree the moment a migration
// file is added without being registered here, or vice versa.
export const CORE_MIGRATIONS: MigrationDef[] = [
  { id: 'core.V001', sql: coreV001 },
  { id: 'core.V002', sql: coreV002 },
  { id: 'core.V003', sql: coreV003 },
  { id: 'core.V004', sql: coreV004 },
  { id: 'core.V005', sql: coreV005 },
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
  supabase: { url?: string; anonKey: string; allowOriginProxy?: boolean }
}

interface InitializedCmsRuntime {
  registry: ReturnType<typeof buildRegistry>
  auth: ReturnType<typeof createAuth>
  db: ReturnType<typeof createDb>
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
    <Suspense fallback={<RouteLoadingState />}>
      <Public>
        <route.element />
      </Public>
    </Suspense>
  )
}

function RouteLoadingState() {
  return (
    <div className="p-6 text-sm text-muted-foreground" data-testid="route-loading-state">
      Loading module…
    </div>
  )
}

/**
 * The single boot path: validate, compose the registry, create the db + auth,
 * then run every plugin's `register` hook in dependency order.
 *
 * All three entry points go through this. `createAdminApp` used to duplicate it
 * inline and `createPublicApp` skipped it entirely — the latter meaning any app
 * built with it threw "public client not initialized" on first render, because
 * no plugin ever got its `register` call.
 */
function initializeCmsRuntime(config: Omit<CMSConfig, 'template'> & { template?: Template }): InitializedCmsRuntime {
  assertValidCmsConfig(config)

  const registry = buildRegistry(config.plugins, config.template)
  const db = createDb({
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    allowOriginProxy: config.supabase.allowOriginProxy,
  })
  const auth = createAuth(db)
  const ctx = { db, auth, config: config.site }

  for (const plugin of registry.orderedPlugins) plugin.register?.(ctx)

  return { registry, auth, db }
}

export function createAdminApp(config: Omit<CMSConfig, 'template'>) {
  const { registry, auth, db } = initializeCmsRuntime(config)

  function Router() {
    return <AdminShell auth={auth} db={db} nav={registry.adminNav} pages={registry.adminPages} widgets={registry.dashboard} />
  }

  return { Router, migrations: [...CORE_MIGRATIONS, ...registry.migrations] }
}

export function createPublicApp(config: CMSConfig) {
  const { registry } = initializeCmsRuntime(config)

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
  const { registry, auth, db } = initializeCmsRuntime(config)
  const Public = config.template.layouts.Public

  function AdminRouter() {
    return <AdminShell auth={auth} db={db} nav={registry.adminNav} pages={registry.adminPages} widgets={registry.dashboard} />
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
