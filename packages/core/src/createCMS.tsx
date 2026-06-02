import type { ReactElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { MigrationDef, Plugin, SiteConfig, Template } from './types'
import { buildRegistry } from './registry'
import { createDb } from './db'
import { createAuth } from './auth'
import { AdminShell } from './AdminShell'
import coreV001 from './migrations/V001_core.sql?raw'

// The kernel's own base migration: creates schema_migrations + is_admin() + the
// site/cms settings tables that every plugin's RLS depends on. It must lead the
// composed migration list, so createCMS prepends it.
const CORE_MIGRATION: MigrationDef = { id: 'core.V001', sql: coreV001 }

export interface CMSInstance {
  Router: () => ReactElement
  migrations: MigrationDef[]
}

export function createCMS(config: {
  template: Template
  plugins: Plugin[]
  site: SiteConfig
  supabase: { url?: string; anonKey: string }
}): CMSInstance {
  const registry = buildRegistry(config.plugins, config.template)
  const db = createDb({ url: config.supabase.url, anonKey: config.supabase.anonKey })
  const auth = createAuth(db)
  const ctx = { db, auth, config: config.site }

  for (const p of config.plugins) p.register?.(ctx)

  const Public = config.template.layouts.Public

  function Router() {
    return (
      <Routes>
        <Route
          path="/admin/*"
          element={<AdminShell auth={auth} nav={registry.adminNav} pages={registry.adminPages} />}
        />
        {registry.routes.map((r) => (
          <Route key={r.path} path={r.path} element={<Public><r.element /></Public>} />
        ))}
      </Routes>
    )
  }

  return { Router, migrations: [CORE_MIGRATION, ...registry.migrations] }
}
