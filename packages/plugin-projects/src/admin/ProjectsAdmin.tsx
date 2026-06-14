import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CMS_CAPABILITIES, hasCapability, useCmsSession } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@imba/ui'
import { DEFAULT_PROJECT_RECORDS } from '../defaults'
import { projectsDb } from '../public/projectsClient'
import type { ProjectSummary } from '../types'

interface ProjectSummaryRow {
  slug: string
  name: string
  category: string
  year: string
  accent: string
  tagline: string
  featured: boolean
  sort_order: number
  status: string
  updated_at?: string
}

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return 'Seed default'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}

export default function ProjectsAdmin() {
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.projectsWrite)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    projectsDb()
      .from('projects_entries')
      .select('slug, name, category, year, accent, tagline, featured, sort_order, status, updated_at')
      .order('sort_order', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) {
          setError(loadError.message)
          setLoading(false)
          return
        }
        setProjects(
          ((data ?? []) as ProjectSummaryRow[]).map((row) => ({
            slug: row.slug,
            name: row.name,
            category: row.category,
            year: row.year,
            accent: row.accent,
            tagline: row.tagline,
            featured: row.featured,
            sortOrder: row.sort_order,
            status: row.status === 'published' ? 'published' : 'draft',
            updatedAt: row.updated_at,
          })),
        )
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const mergedProjects = useMemo(() => {
    const bySlug = new Map(projects.map((project) => [project.slug, project]))
    return DEFAULT_PROJECT_RECORDS.map((project) => {
      const saved = bySlug.get(project.slug)
      return saved ?? {
        slug: project.slug,
        name: project.name,
        category: project.category,
        year: project.year,
        accent: project.accent,
        tagline: project.tagline,
        featured: project.featured,
        sortOrder: project.sortOrder,
        status: 'published' as const,
        updatedAt: undefined,
      }
    }).concat(projects.filter((project) => !DEFAULT_PROJECT_RECORDS.some((entry) => entry.slug === project.slug)))
  }, [projects])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the preserved mtiosavljevic case-study collection and project detail pages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {canWrite ? 'Write enabled' : 'Read only'}
          </span>
          <Button asChild disabled={!canWrite}>
            <Link to="/admin/projects/new">New project</Link>
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading projects…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        {mergedProjects.map((project) => (
          <Card key={project.slug}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{project.name}</span>
                <span className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {project.status}
                </span>
              </CardTitle>
              <CardDescription>{project.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>Slug: <span className="font-mono text-foreground">{project.slug}</span></div>
                <div>Year: <span className="text-foreground">{project.year}</span></div>
                <div>Category: <span className="text-foreground">{project.category}</span></div>
                <div>Updated: {formatUpdatedAt(project.updatedAt)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2 w-20 rounded-full" style={{ backgroundColor: project.accent }} />
                <Button asChild variant="outline" disabled={!canWrite}>
                  <Link to={`/admin/projects/${project.slug}`}>{canWrite ? 'Edit project' : 'View project'}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
