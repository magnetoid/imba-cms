import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import type { PluginContext } from '@imba/core'
import V001_projects from './migrations/V001_projects.sql?raw'
import ProjectEditor from './admin/ProjectEditor'
import ProjectsAdmin from './admin/ProjectsAdmin'
import { DEFAULT_PROJECT_RECORDS } from './defaults'
import { createSupabaseProjectsPublicClient, setProjectsDb, setProjectsPublicClient } from './public/projectsClient'

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
      icon: 'FolderKanban',
      requiredCapabilities: [CMS_CAPABILITIES.projectsRead],
    },
    pages: [
      { path: '/admin/projects', element: ProjectsAdmin, requiredCapabilities: [CMS_CAPABILITIES.projectsRead] },
      { path: '/admin/projects/:slug', element: ProjectEditor, requiredCapabilities: [CMS_CAPABILITIES.projectsWrite] },
    ],
  },
  migrations: [
    { id: 'projects.V001', sql: V001_projects },
  ],
  seed: seedDefaultProjects,
  register(ctx) {
    setProjectsDb(ctx.db)
    setProjectsPublicClient(createSupabaseProjectsPublicClient(ctx.db))
  },
})

export { DEFAULT_PROJECT_RECORDS, buildDefaultProjectRecord, buildEmptyProjectRecord } from './defaults'
export { DEFAULT_PROJECTS_DATA } from './projectsData'
export {
  createSupabaseProjectsPublicClient,
  getProjectOrDefault,
  listProjectsOrDefault,
  projectsPublicClient,
  setProjectsPublicClient,
} from './public/projectsClient'
export type { ProjectContent, ProjectRecord, ProjectStatus, ProjectSummary } from './types'
export { emptyProjectContent, parseProjectContent, projectContentSchema } from './types'
