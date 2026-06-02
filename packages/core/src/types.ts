import type { ComponentType } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Locale = string
export type Component = ComponentType<Record<string, unknown>>

export interface RouteDef {
  path: string
  element: Component
  seo?: { title?: string; description?: string }
}

export interface NavItem {
  group: string
  label: string
  path: string
  icon?: string
}

export interface AdminDef {
  nav: NavItem
  pages: RouteDef[]
}

export interface MigrationDef {
  id: string // namespaced, e.g. 'blog.V001'
  sql: string
}

export interface WidgetDef {
  id: string
  render: Component
}

export interface SiteConfig {
  name: string
  domain: string
  defaultLocale: Locale
  locales: Locale[]
  logoUrl?: string
  social?: Record<string, string>
  contactEmail?: string
}

export interface AuthApi {
  getSession: () => Promise<unknown>
  onChange: (cb: (session: unknown) => void) => () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export interface PluginContext {
  db: SupabaseClient
  auth: AuthApi
  config: SiteConfig
}

export interface Plugin {
  name: string
  version: string
  dependsOn?: string[]
  tablePrefix?: string
  routes?: RouteDef[]
  admin?: AdminDef
  migrations?: MigrationDef[]
  i18n?: Record<Locale, Record<string, string>>
  dashboard?: WidgetDef[]
  seed?: (ctx: PluginContext) => Promise<void>
  edgeFunctions?: string[]
  register?: (ctx: PluginContext) => void
}

export interface Template {
  name: string
  pages?: RouteDef[]
  layouts: { Public: Component; Admin?: Component }
  overrides?: Record<string, Component>
  expects?: string[]
}
