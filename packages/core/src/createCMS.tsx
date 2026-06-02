import type { ReactElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { MigrationDef, Plugin, SiteConfig, Template } from './types'
import { buildRegistry } from './registry'
import { createDb } from './db'
import { createAuth } from './auth'
import { AdminShell } from './AdminShell'

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

  return { Router, migrations: registry.migrations }
}
