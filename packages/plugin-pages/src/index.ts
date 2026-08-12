import { lazy } from 'react'
import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import type { PluginContext } from '@imba/core'
import V001_pages from './migrations/V001_pages.sql?raw'
import V002_pages from './migrations/V002_pages_rbac.sql?raw'
import { buildDefaultPageRecord } from './defaults'
import { setPagesDb, setPagesPublicClient, createSupabasePagesPublicClient } from './public/pagesClient'
import { CMS_PAGE_SLUGS } from './types'

const PagesAdmin = lazy(async () => import('./admin/PagesAdmin'))
const PageEditor = lazy(async () => import('./admin/PageEditor'))

async function seedDefaultPages(ctx: PluginContext) {
  const { data, error } = await ctx.db
    .from('pages_entries')
    .select('slug')

  if (error) throw error

  const existing = new Set((data ?? []).map((row) => String(row.slug)))
  const rows = CMS_PAGE_SLUGS
    .filter((slug) => !existing.has(slug))
    .map((slug) => {
      const page = buildDefaultPageRecord(slug)
      return {
        slug,
        title: page.title,
        status: page.status,
        seo_title: page.seoTitle,
        seo_description: page.seoDescription,
        content: page.content,
        published_at: new Date().toISOString(),
      }
    })

  if (rows.length === 0) return

  const { error: insertError } = await ctx.db.from('pages_entries').insert(rows)
  if (insertError) throw insertError
}

export default definePlugin({
  name: 'pages',
  version: '0.1.0',
  tablePrefix: 'pages_',
  admin: {
    nav: {
      group: 'Content',
      label: 'Pages',
      path: '/admin/pages',
      icon: 'LayoutTemplate',
      requiredCapabilities: [CMS_CAPABILITIES.pagesRead],
    },
    pages: [
      { path: '/admin/pages', element: PagesAdmin, requiredCapabilities: [CMS_CAPABILITIES.pagesRead] },
      { path: '/admin/pages/:slug', element: PageEditor, requiredCapabilities: [CMS_CAPABILITIES.pagesWrite] },
    ],
  },
  migrations: [
    { id: 'pages.V001', sql: V001_pages },
    { id: 'pages.V002', sql: V002_pages },
  ],
  seed: seedDefaultPages,
  register(ctx) {
    setPagesDb(ctx.db)
    setPagesPublicClient(createSupabasePagesPublicClient(ctx.db))
  },
})

export {
  CMS_PAGE_DEFINITIONS,
  DEFAULT_SITE_PAGES,
  buildDefaultPageRecord,
} from './defaults'
export {
  createSupabasePagesPublicClient,
  getCmsPageOrDefault,
  pagesPublicClient,
  setPagesPublicClient,
} from './public/pagesClient'
export type {
  AboutPageContent,
  CmsPageContentMap,
  CmsPageRecord,
  CmsPageSlug,
  CmsPageStatus,
  ContactPageContent,
  HomePageContent,
  ServicesPageContent,
} from './types'
export { CMS_PAGE_SLUGS, parseCmsPageContent } from './types'
