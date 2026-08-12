import type { ComponentType } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Locale = string
export type Component = ComponentType<Record<string, unknown>>
export type CmsCapability = string
export type CapabilityRequirement = readonly CmsCapability[]

export interface RouteDef {
  path: string
  element: Component
  seo?: { title?: string; description?: string }
  requiredCapabilities?: CapabilityRequirement
}

export interface NavItem {
  group: string
  label: string
  path: string
  icon?: string
  requiredCapabilities?: CapabilityRequirement
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
  requiredCapabilities?: CapabilityRequirement
}

export interface ThemeLink {
  label: string
  to?: string
  href?: string
}

export interface ThemeAction {
  label: string
  to?: string
  href?: string
}

export interface ThemeColumn {
  heading: string
  links: ThemeLink[]
}

export interface ThemeProject {
  index: string
  title: string
  category: string
  href?: string
  span?: string
  ratio?: string
}

export interface ThemeService {
  no: string
  title: string
  body: string
}

export interface ThemeHeroConfig {
  eyebrow?: string
  title?: string
  lead?: string
  primaryAction?: ThemeAction
  secondaryAction?: ThemeAction
  capabilities?: string[]
}

export interface ThemeFooterConfig {
  ctaEyebrow?: string
  ctaTitle?: string
  contactEmail?: string
  contactBlurb?: string
  columns?: ThemeColumn[]
  socialLinks?: ThemeLink[]
  copyright?: string
  platformNote?: string
}

export interface ThemeHomeConfig {
  hero?: ThemeHeroConfig
  selectedWorkEyebrow?: string
  selectedWorkTitle?: string
  selectedWorkAction?: ThemeAction
  selectedWorkItems?: ThemeProject[]
  statementEyebrow?: string
  statementText?: string
  statementAccentText?: string
  capabilitiesEyebrow?: string
  capabilitiesTitle?: string
  capabilitiesItems?: ThemeService[]
  ctaEyebrow?: string
  ctaTitle?: string
  ctaAction?: ThemeAction
}

export interface ThemeBrandConfig {
  name?: string
  accent?: string
  homePath?: string
}

export interface ThemeConfig {
  siteUrl?: string
  brand?: ThemeBrandConfig
  navLinks?: ThemeLink[]
  navCta?: ThemeAction
  footer?: ThemeFooterConfig
  home?: ThemeHomeConfig
}

export type ThemeSlots = Record<string, Component>

export interface SiteConfig {
  name: string
  domain: string
  defaultLocale: Locale
  locales: Locale[]
  logoUrl?: string
  social?: Record<string, string>
  contactEmail?: string
  theme?: ThemeConfig
  themeSlots?: ThemeSlots
}

export interface CmsUserAppMetadata {
  role?: string
  is_admin?: boolean
  permissions?: string[]
}

export type CmsRole = 'super_admin' | 'content_admin' | 'editor' | 'author' | 'reviewer' | 'media_manager'

export interface CmsUser {
  id: string
  email?: string
  role?: string
  app_metadata?: CmsUserAppMetadata
  user_metadata?: Record<string, unknown>
}

export interface CmsSession {
  user: CmsUser
  access_token?: string
  expires_at?: number
  cms_role?: CmsRole
}

export interface AuthApi {
  getSession: () => Promise<CmsSession | null>
  onChange: (cb: (session: CmsSession | null) => void) => () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export interface PluginContext {
  db: SupabaseClient
  auth: AuthApi
  config: SiteConfig
}

export interface PluginCompatibilityRuntime {
  admin?: boolean
  public?: boolean
  server?: boolean
}

export interface PluginCompatibility {
  coreVersion?: string
  pluginApiVersion?: string
  peerPlugins?: Record<string, string>
  provides?: string[]
  requires?: string[]
  runtime?: PluginCompatibilityRuntime
}

export interface Plugin {
  name: string
  version: string
  dependsOn?: string[]
  compatibility?: PluginCompatibility
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
  theme?: {
    defaults?: ThemeConfig
    slots?: ThemeSlots
  }
}
