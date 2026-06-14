import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import { configureSettingsClient } from './client'
import SettingsHome from './admin/SettingsHome'
import GraphQLSettingsPage from './admin/GraphQLSettingsPage'
import McpSettingsPage from './admin/McpSettingsPage'
import SettingsWidget from './admin/SettingsWidget'

const settings = definePlugin({
  name: 'settings',
  version: '0.1.0',
  admin: {
    nav: { group: 'System', label: 'Settings', path: '/admin/settings', requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
    pages: [
      { path: '/admin/settings', element: SettingsHome, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      { path: '/admin/settings/graphql', element: GraphQLSettingsPage, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      { path: '/admin/settings/mcp', element: McpSettingsPage, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
    ],
  },
  dashboard: [{ id: 'settings-overview', render: SettingsWidget, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] }],
  register(ctx) {
    configureSettingsClient({ auth: ctx.auth })
  },
})

export default settings
export * from './shared'
export * from './service'
