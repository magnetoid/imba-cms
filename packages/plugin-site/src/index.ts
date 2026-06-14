import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import type { PluginContext } from '@imba/core'
import SiteAdmin from './admin/SiteAdmin'
import { buildDefaultSiteSettingsRecord } from './defaults'
import V001_site from './migrations/V001_site.sql?raw'
import { createSupabaseSitePublicClient, setSiteDb, setSitePublicClient } from './public/siteClient'
import { PRIMARY_SITE_SETTINGS_SLUG } from './types'

async function seedDefaultSiteSettings(ctx: PluginContext) {
  const { data, error } = await ctx.db
    .from('site_entries')
    .select('slug')

  if (error) throw error

  const existing = new Set((data ?? []).map((row) => String(row.slug)))
  if (existing.has(PRIMARY_SITE_SETTINGS_SLUG)) return

  const settings = buildDefaultSiteSettingsRecord()
  const { error: insertError } = await ctx.db.from('site_entries').insert({
    slug: PRIMARY_SITE_SETTINGS_SLUG,
    title: settings.title,
    status: settings.status,
    content: settings.content,
    published_at: new Date().toISOString(),
  })

  if (insertError) throw insertError
}

export default definePlugin({
  name: 'site',
  version: '0.1.0',
  tablePrefix: 'site_',
  admin: {
    nav: {
      group: 'Content',
      label: 'Site',
      path: '/admin/site',
      icon: 'Globe',
      requiredCapabilities: [CMS_CAPABILITIES.siteRead],
    },
    pages: [
      { path: '/admin/site', element: SiteAdmin, requiredCapabilities: [CMS_CAPABILITIES.siteRead] },
    ],
  },
  migrations: [
    { id: 'site.V001', sql: V001_site },
  ],
  seed: seedDefaultSiteSettings,
  register(ctx) {
    setSiteDb(ctx.db)
    setSitePublicClient(createSupabaseSitePublicClient(ctx.db))
  },
})

export {
  buildDefaultSiteSettingsRecord,
  buildSiteThemeConfig,
  DEFAULT_SITE_SETTINGS_CONTENT,
  DEFAULT_SITE_SETTINGS_RECORD,
} from './defaults'
export {
  createSupabaseSitePublicClient,
  getSiteSettingsOrDefault,
  setSitePublicClient,
  sitePublicClient,
} from './public/siteClient'
export type {
  SiteSettingsAction,
  SiteSettingsContent,
  SiteSettingsLink,
  SiteSettingsRecord,
  SiteSettingsSocialLink,
  SiteSettingsStatus,
} from './types'
export {
  parseSiteSettingsContent,
  PRIMARY_SITE_SETTINGS_SLUG,
  SITE_SETTINGS_STATUS,
} from './types'
