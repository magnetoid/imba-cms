/**
 * Node-safe entry point: `@imba/core/node`.
 *
 * The main `@imba/core` entry is browser-first — it pulls in React, react-router
 * and, critically, `import sql from './migrations/V001_core.sql?raw'`, a
 * Vite-only specifier. TypeScript follows imports regardless of `include`, so a
 * Node package importing `@imba/core` compiled the whole graph into its own
 * `dist/` and emitted that `?raw` specifier verbatim. The result was a binary
 * Node could not load at all.
 *
 * This module therefore re-exports only what a server process needs, from files
 * that contain no JSX and no bundler-specific imports. Unlike the main entry it
 * is **built** (`pnpm --filter @imba/core build`), so consumers resolve a real
 * `.js` artifact and can keep `rootDir: "src"`.
 *
 * Keep this list dependency-light on purpose. If something added here starts
 * pulling React or a `?raw` import back in, the `build` script fails, which is
 * the intended guard.
 */

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
} from './permissions.js'

export {
  graphqlSettingsSchema,
  mcpSettingsSchema,
  DEFAULT_GRAPHQL_SETTINGS,
  DEFAULT_MCP_SETTINGS,
  type GraphqlSettings,
  type McpSettings,
  type AuthMode,
  type ConnectionTestResult,
} from './settingsContracts.js'

export type {
  CapabilityRequirement,
  CmsCapability,
  CmsRole,
  CmsSession,
  CmsUser,
  CmsUserAppMetadata,
  MigrationDef,
} from './types.js'
