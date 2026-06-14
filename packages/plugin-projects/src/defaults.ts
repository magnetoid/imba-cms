import { emptyProjectContent } from './types'
import { DEFAULT_PROJECTS_DATA } from './projectsData'
import type { ProjectRecord } from './types'

export function buildDefaultProjectRecord(project: (typeof DEFAULT_PROJECTS_DATA)[number]): ProjectRecord {
  return {
    id: `default-${project.slug}`,
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
    sortOrder: project.sortOrder,
    status: 'published',
    seoTitle: `${project.name} — Case Study`,
    seoDescription: project.hero,
    content: project.content,
  }
}

export function buildEmptyProjectRecord(): ProjectRecord {
  return {
    id: 'default-new-project',
    slug: '',
    name: '',
    url: '',
    year: '',
    category: '',
    tagline: '',
    hero: '',
    summary: '',
    accent: '#10B981',
    featured: false,
    sortOrder: 999,
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    content: emptyProjectContent(),
  }
}

export const DEFAULT_PROJECT_RECORDS = DEFAULT_PROJECTS_DATA.map(buildDefaultProjectRecord)
