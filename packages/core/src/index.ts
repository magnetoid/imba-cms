export * from './types'
export { definePlugin, defineTemplate } from './define'
export { validatePlugins } from './validate'
export { orderPlugins, orderMigrations } from './migrations'
export { buildRegistry, collectI18nResources, type CMSRegistry, type I18nResources, type ThemeResolverEntry } from './registry'
export { createDb, resolveSupabaseUrl } from './db'
export { createAuth } from './auth'
export { readBrowserRuntimeOptionalValue, readBrowserRuntimeValue } from './browserRuntime'
export { registerVitePreloadReload } from './preload'
export {
  CMS_CAPABILITIES,
  ALL_CMS_CAPABILITIES,
  ROLE_CAPABILITIES,
  CMS_ROLES,
  parseCmsRole,
  resolveCapabilities,
  hasAdminAccess,
  hasCapability,
  hasCapabilities,
} from './permissions'
export { CmsSessionProvider, useCmsSession } from './session'
export { ThemeProvider, ThemeSlot, mergeThemeConfig, useThemeConfig, useThemeSlot, useThemeSlots, type ThemeResolver } from './theme'
export { useDocumentSeo, type DocumentSeoOptions } from './seo'
export { createCMS, createAdminApp, createPublicApp, type CMSInstance } from './createCMS'
export { seedPlugins, seedablePlugins, type SeedOptions, type SeedResult } from './seed'
export { composeMigrations, CORE_MIGRATIONS } from './manifest'
export {
  describeWriteError,
  describeSilentDenial,
  isPermissionDenied,
  type WriteErrorLike,
} from './writeErrors'
export {
  graphqlSettingsSchema,
  mcpSettingsSchema,
  DEFAULT_GRAPHQL_SETTINGS,
  DEFAULT_MCP_SETTINGS,
  type GraphqlSettings,
  type McpSettings,
  type AuthMode,
  type ConnectionTestResult,
} from './settingsContracts'
export { initI18n } from './i18n'
export { planMigrations, applyMigrations } from './cli/migrate'
export type { ApplyOptions } from './cli/migrate'
