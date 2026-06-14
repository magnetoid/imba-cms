import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CMS_CAPABILITIES, hasCapability, useCmsSession } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@imba/ui'
import { buildEmptyProjectRecord, DEFAULT_PROJECT_RECORDS } from '../defaults'
import { projectsDb } from '../public/projectsClient'
import { parseProjectContent } from '../types'
import type { ProjectRecord, ProjectStatus } from '../types'

interface ProjectRow {
  id: string
  slug: string
  name: string
  url: string
  year: string
  category: string
  tagline: string
  hero: string
  summary: string
  accent: string
  featured: boolean
  sort_order: number
  status: ProjectStatus
  seo_title: string
  seo_description: string
  content: unknown
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export default function ProjectEditor() {
  const { slug: rawSlug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.projectsWrite)
  const canPublish = hasCapability(session, CMS_CAPABILITIES.projectsPublish)
  const slug = rawSlug ?? 'new'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<ProjectRecord>(buildEmptyProjectRecord())
  const [contentText, setContentText] = useState(prettyJson(buildEmptyProjectRecord().content))

  useEffect(() => {
    let active = true

    if (slug === 'new') {
      const empty = buildEmptyProjectRecord()
      setProject(empty)
      setContentText(prettyJson(empty.content))
      setLoading(false)
      return () => {
        active = false
      }
    }

    projectsDb()
      .from('projects_entries')
      .select('id, slug, name, url, year, category, tagline, hero, summary, accent, featured, sort_order, status, seo_title, seo_description, content')
      .eq('slug', slug)
      .maybeSingle<ProjectRow>()
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) {
          setError(loadError.message)
          setLoading(false)
          return
        }

        const fallback = DEFAULT_PROJECT_RECORDS.find((entry) => entry.slug === slug) ?? buildEmptyProjectRecord()
        const nextProject: ProjectRecord = data
          ? {
              id: data.id,
              slug: data.slug,
              name: data.name,
              url: data.url,
              year: data.year,
              category: data.category,
              tagline: data.tagline,
              hero: data.hero,
              summary: data.summary,
              accent: data.accent,
              featured: data.featured,
              sortOrder: data.sort_order,
              status: data.status === 'published' ? 'published' : 'draft',
              seoTitle: data.seo_title,
              seoDescription: data.seo_description,
              content: parseProjectContent(data.content),
            }
          : fallback

        setProject(nextProject)
        setContentText(prettyJson(nextProject.content))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  const editorTitle = useMemo(() => (slug === 'new' ? 'New project' : project.name || 'Edit project'), [project.name, slug])

  async function handleSave() {
    if (!canWrite) {
      setError('You do not have permission to edit projects.')
      return
    }

    const nextSlug = project.slug.trim()
    if (!nextSlug) {
      setError('Slug is required.')
      return
    }
    if (!project.name.trim()) {
      setError('Project name is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const parsedContent = parseProjectContent(JSON.parse(contentText) as unknown)
      const nextStatus = canPublish ? project.status : 'draft'
      const publishedAt = nextStatus === 'published' ? new Date().toISOString() : null
      const { error: saveError } = await projectsDb().from('projects_entries').upsert({
        slug: nextSlug,
        name: project.name.trim(),
        url: project.url.trim(),
        year: project.year.trim(),
        category: project.category.trim(),
        tagline: project.tagline.trim(),
        hero: project.hero.trim(),
        summary: project.summary.trim(),
        accent: project.accent.trim() || '#10B981',
        featured: project.featured,
        sort_order: project.sortOrder,
        status: nextStatus,
        seo_title: project.seoTitle.trim(),
        seo_description: project.seoDescription.trim(),
        content: parsedContent,
        published_at: publishedAt,
      }, { onConflict: 'slug' })

      if (saveError) throw saveError
      navigate('/admin/projects')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading project editor…</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link to="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{editorTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured case-study editor for the preserved mtiosavljevic projects section.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving || !canWrite}>
          {saving ? 'Saving…' : 'Save project'}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Project content</CardTitle>
            <CardDescription>Headline fields stay structured. Deep case-study sections are validated JSON.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-slug">Slug</Label>
                <Input id="project-slug" value={project.slug} onChange={(event) => setProject((current) => ({ ...current, slug: event.target.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') }))} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-category">Category</Label>
                <Input id="project-category" value={project.category} onChange={(event) => setProject((current) => ({ ...current, category: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-year">Year</Label>
                <Input id="project-year" value={project.year} onChange={(event) => setProject((current) => ({ ...current, year: event.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-url">Live URL</Label>
              <Input id="project-url" value={project.url} onChange={(event) => setProject((current) => ({ ...current, url: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-tagline">Tagline</Label>
              <Input id="project-tagline" value={project.tagline} onChange={(event) => setProject((current) => ({ ...current, tagline: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-hero">Hero</Label>
              <textarea
                id="project-hero"
                className="min-h-[110px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={project.hero}
                onChange={(event) => setProject((current) => ({ ...current, hero: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-summary">Summary</Label>
              <textarea
                id="project-summary"
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={project.summary}
                onChange={(event) => setProject((current) => ({ ...current, summary: event.target.value }))}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="project-accent">Accent</Label>
                <Input id="project-accent" value={project.accent} onChange={(event) => setProject((current) => ({ ...current, accent: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-order">Sort order</Label>
                <Input id="project-order" type="number" value={String(project.sortOrder)} onChange={(event) => setProject((current) => ({ ...current, sortOrder: Number.parseInt(event.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <select
                  id="project-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={project.status}
                  onChange={(event) => setProject((current) => ({ ...current, status: event.target.value === 'published' ? 'published' : 'draft' }))}
                  disabled={!canPublish}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="project-featured"
                type="checkbox"
                checked={project.featured}
                onChange={(event) => setProject((current) => ({ ...current, featured: event.target.checked }))}
              />
              <Label htmlFor="project-featured">Featured project</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-seo-title">SEO title</Label>
              <Input id="project-seo-title" value={project.seoTitle} onChange={(event) => setProject((current) => ({ ...current, seoTitle: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-seo-description">SEO description</Label>
              <textarea
                id="project-seo-description"
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={project.seoDescription}
                onChange={(event) => setProject((current) => ({ ...current, seoDescription: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-content">Structured case-study JSON</Label>
              <textarea
                id="project-content"
                className="min-h-[620px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={contentText}
                onChange={(event) => setContentText(event.target.value)}
                spellCheck={false}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>This slice restores the old projects UX without bringing back the old mixed admin/CRM stack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Use one record per case study. The public template renders listing and detail pages from this collection.</p>
            <p>The JSON section covers the deep storytelling blocks: role, stack, stats, problem, approach, features, outcomes, lessons, and optional quote.</p>
            <p>Projects save through `slug` upserts, so seeded projects can be safely overridden from admin.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
