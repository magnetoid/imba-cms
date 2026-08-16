// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { PluginContext } from '@imba/core'
import projects from './index'
import { DEFAULT_PROJECT_RECORDS } from './defaults'
import { setProjectsPublicClient } from './public/projectsClient'

const ctx = {} as PluginContext

describe('plugin-projects resolveTheme', () => {
  it('turns featured published projects into the home page selected-work items', async () => {
    const [a, b, c] = DEFAULT_PROJECT_RECORDS
    setProjectsPublicClient({
      listPublishedProjects: vi.fn().mockResolvedValue([
        { ...a!, featured: true, sortOrder: 2 },
        { ...b!, featured: false, sortOrder: 1 },
        { ...c!, featured: true, sortOrder: 1 },
      ]),
      getPublishedProjectBySlug: vi.fn(),
    })
    const theme = await projects.resolveTheme!(ctx)
    const items = theme?.home?.selectedWorkItems ?? []
    // Featured only, sort order respected, numbered from 01, linked to /work/:slug.
    expect(items.map((item) => item.title)).toEqual([c!.name, a!.name])
    expect(items[0]).toMatchObject({ index: '01', category: c!.category, href: `/work/${c!.slug}` })
    expect(items[1]!.index).toBe('02')
  })

  it('falls back to every published project when none is flagged featured', async () => {
    const [a, b] = DEFAULT_PROJECT_RECORDS
    setProjectsPublicClient({
      listPublishedProjects: vi.fn().mockResolvedValue([{ ...a!, featured: false }, { ...b!, featured: false }]),
      getPublishedProjectBySlug: vi.fn(),
    })
    const theme = await projects.resolveTheme!(ctx)
    expect(theme?.home?.selectedWorkItems?.map((i) => i.title)).toEqual([a!.name, b!.name])
  })

  it('contributes nothing when no project is published', async () => {
    setProjectsPublicClient({ listPublishedProjects: vi.fn().mockResolvedValue([]), getPublishedProjectBySlug: vi.fn() })
    expect(await projects.resolveTheme!(ctx)).toBeUndefined()
  })
})
