export { readConfig, createServiceClient, type SettingsServerConfig } from './config'
export {
  getGraphqlSettings,
  updateGraphqlSettings,
  testGraphqlSettingsConnection,
  getMcpSettings,
  updateMcpSettings,
  testMcpSettingsConnection,
  requireSettingsAccess,
  type GraphqlSettingsResponse,
  type McpSettingsResponse,
} from './service'
export { createSettingsHttpHandler, startSettingsServer } from './server'
