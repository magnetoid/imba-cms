import { lazy } from 'react'
import { CMS_CAPABILITIES, definePlugin, readBrowserRuntimeOptionalValue } from '@imba/core'
import type { PluginContext } from '@imba/core'
import V001_projects from './migrations/V001_projects.sql?raw'
import V002_projects from './migrations/V002_projects_rbac.sql?raw'
import { DEFAULT_PROJECT_RECORDS } from './defaults'
import { createHttpProjectsPublicClient, createSupabaseProjectsPublicClient, projectsPublicClient, setProjectsDb, setProjectsPublicClient } from './public/projectsClient'

const ProjectEditor = lazy(async () => import('./admin/ProjectEditor'))
const ProjectsAdmin = lazy(async () => import('./admin/ProjectsAdmin'))

async function seedDefaultProjects(ctx: PluginContext) {
  const { data, error } = await ctx.db
    .from('projects_entries')
    .select('slug')

  if (error) throw error

  const existing = new Set((data ?? []).map((row) => String(row.slug)))
  const rows = DEFAULT_PROJECT_RECORDS
    .filter((project) => !existing.has(project.slug))
    .map((project) => ({
      slug: project.slug,
      name: project.name,
      url: project.url,
      year: project.year,
      category: project.category,
      tagline: project.tagline,
      hero: project.hero,
      summary: project.summary,
      accent: project.accent,
      featured: project.featured,
      sort_order: project.sortOrder,
      status: project.status,
      seo_title: project.seoTitle,
      seo_description: project.seoDescription,
      content: project.content,
      published_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return

  const { error: insertError } = await ctx.db.from('projects_entries').insert(rows)
  if (insertError) throw insertError
}

export default definePlugin({
  name: 'projects',
  version: '0.1.0',
  tablePrefix: 'projects_',
  admin: {
    nav: {
      group: 'Content',
      label: 'Projects',
      path: '/admin/projects',
      requiredCapabilities: [CMS_CAPABILITIES.projectsRead],
    },
    pages: [
      { path: '/admin/projects', element: ProjectsAdmin, requiredCapabilities: [CMS_CAPABILITIES.projectsRead] },
      { path: '/admin/projects/:slug', element: ProjectEditor, requiredCapabilities: [CMS_CAPABILITIES.projectsWrite] },
    ],
  },
  migrations: [
    { id: 'projects.V001', sql: V001_projects },
    { id: 'projects.V002', sql: V002_projects },
  ],
  seed: seedDefaultProjects,
  register(ctx) {
    setProjectsDb(ctx.db)
    const contentApiUrl = readBrowserRuntimeOptionalValue('IMBA_CONTENT_API_URL')
    setProjectsPublicClient(
      contentApiUrl
        ? createHttpProjectsPublicClient({ baseUrl: contentApiUrl })
        : createSupabaseProjectsPublicClient(ctx.db),
    )
  },
  /**
   * Published projects become the home page's "selected work" grid — the
   * `ThemeProject` shape in core exists for exactly this. Featured ones win;
   * with none flagged, every published project is shown. Nothing published
   * means the template keeps its own sample grid.
   */
  async resolveTheme() {
    const published = await projectsPublicClient().listPublishedProjects()
    if (published.length === 0) return undefined
    const featured = published.filter((p) => p.featured)
    const chosen = (featured.length > 0 ? featured : published)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return {
      home: {
        selectedWorkItems: chosen.map((project, i) => ({
          index: String(i + 1).padStart(2, '0'),
          title: project.name,
          category: project.category,
          href: `/work/${project.slug}`,
        })),
      },
    }
  },
})

export { DEFAULT_PROJECT_RECORDS, buildDefaultProjectRecord, buildEmptyProjectRecord } from './defaults'
export { DEFAULT_PROJECTS_DATA } from './projectsData'
export {
  createHttpProjectsPublicClient,
  createSupabaseProjectsPublicClient,
  getProjectOrDefault,
  listProjectsOrDefault,
  projectsPublicClient,
  setProjectsPublicClient,
} from './public/projectsClient'
export type { ProjectContent, ProjectRecord, ProjectStatus, ProjectSummary } from './types'
export { emptyProjectContent, parseProjectContent, projectContentSchema } from './types'
