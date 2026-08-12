/**
 * The settings contracts moved to `@imba/core`.
 *
 * They are consumed by both this browser plugin and the Node
 * `@imba/settings-server`. The server used to deep-import
 * `@imba/plugin-settings/src/shared`, which dragged a browser package into a
 * Node build; hosting the schemas in core lets both sides share one definition
 * without that coupling.
 *
 * This module stays as a re-export so existing imports keep working.
 */
export {
  graphqlSettingsSchema,
  mcpSettingsSchema,
  DEFAULT_GRAPHQL_SETTINGS,
  DEFAULT_MCP_SETTINGS,
  type GraphqlSettings,
  type McpSettings,
  type AuthMode,
  type ConnectionTestResult,
} from '@imba/core'
