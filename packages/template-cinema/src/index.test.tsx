import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import cinema from './index'

describe('@imba/template-cinema', () => {
  it('is a valid Template with a Public layout and a home page', () => {
    expect(cinema.name).toBe('cinema')
    expect(typeof cinema.layouts.Public).toBe('function')
    expect(cinema.pages?.some((p) => p.path === '/')).toBe(true)
  })

  it('Public layout renders its children', () => {
    const Public = cinema.layouts.Public
    render(
      <MemoryRouter>
        <Public>
          <div>CHILD</div>
        </Public>
      </MemoryRouter>,
    )
    expect(screen.getByText('CHILD')).toBeDefined()
  })
})

describe('@imba/template-cinema reads theme config', () => {
  it('renders navigation, brand and footer from ThemeProvider instead of hardcoded copy', async () => {
    const { ThemeProvider } = await import('@imba/core')
    const Public = cinema.layouts.Public
    render(
      <MemoryRouter>
        <ThemeProvider
          template={cinema}
          site={{ name: 'Test', domain: 't.com', defaultLocale: 'en', locales: ['en'] }}
          resolvers={[async () => ({
            brand: { name: 'Managed', accent: 'Studio' },
            navLinks: [{ label: 'Case Studies', to: '/work' }],
            navCta: { label: 'Book a call', to: '/contact' },
            footer: {
              contactEmail: 'studio@example.com',
              ctaTitle: 'Say hello.',
              columns: [{ heading: 'Managed column', links: [{ label: 'Managed link', to: '/x' }] }],
              socialLinks: [{ label: 'Mastodon', href: 'https://example.social' }],
              copyright: '© Managed Co',
              platformNote: 'Managed note',
            },
          })]}
        >
          <Public>
            <div>CHILD</div>
          </Public>
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(await screen.findAllByText('Case Studies')).not.toHaveLength(0)
    expect(screen.getAllByText('Book a call')).not.toHaveLength(0)
    expect(screen.getAllByText('Managed').length).toBeGreaterThan(0)
    expect(screen.getByText('studio@example.com')).toBeDefined()
    expect(screen.getByText('Say hello.')).toBeDefined()
    expect(screen.getByText('Managed column')).toBeDefined()
    expect(screen.getByText('Managed link')).toBeDefined()
    expect(screen.getByText('Mastodon')).toBeDefined()
    expect(screen.getByText('© Managed Co')).toBeDefined()
    expect(screen.getByText('Managed note')).toBeDefined()
    // The hardcoded defaults are gone once a resolver supplies its own.
    expect(screen.queryByText('Journal')).toBeNull()
  })

  it('ships its former hardcoded copy as template theme defaults', () => {
    expect(cinema.theme?.defaults?.navLinks?.map((l) => l.label)).toEqual(['Work', 'Services', 'Journal', 'About', 'Contact'])
    expect(cinema.theme?.defaults?.footer?.contactEmail).toBe('hello@imbaproduction.com')
    expect(cinema.theme?.defaults?.brand).toEqual({ name: 'Imba', accent: 'Production', homePath: '/' })
  })
})

describe('@imba/template-cinema public pages', () => {
  it('registers the routes its own navigation links to', () => {
    const paths = (cinema.pages ?? []).map((p) => p.path)
    expect(paths).toEqual(expect.arrayContaining(['/', '/work', '/work/:slug', '/about', '/services', '/contact']))
    expect(cinema.expects).toEqual(expect.arrayContaining(['blog', 'pages', 'projects']))
  })

  it('renders the About page from the pages plugin content', async () => {
    const { setPagesPublicClient, buildDefaultPageRecord } = await import('@imba/plugin-pages')
    const about = buildDefaultPageRecord('about')
    setPagesPublicClient({
      getPage: vi.fn().mockResolvedValue({ ...about, status: 'published', content: { ...about.content, title: 'Managed About Title' } }),
      listPages: vi.fn().mockResolvedValue([]),
    })
    const About = cinema.pages!.find((p) => p.path === '/about')!.element
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(await screen.findByText('Managed About Title')).toBeDefined()
    expect(screen.getByText(about.content.focusAreas[0]!)).toBeDefined()
  })

  it('renders the Work index from published projects and links each to its case study', async () => {
    const { setProjectsPublicClient, DEFAULT_PROJECT_RECORDS } = await import('@imba/plugin-projects')
    const project = { ...DEFAULT_PROJECT_RECORDS[0]!, name: 'Managed Project' }
    setProjectsPublicClient({
      listPublishedProjects: vi.fn().mockResolvedValue([project]),
      getPublishedProjectBySlug: vi.fn().mockResolvedValue(project),
    })
    const Work = cinema.pages!.find((p) => p.path === '/work')!.element
    render(<MemoryRouter><Work /></MemoryRouter>)
    const link = await screen.findByRole('link', { name: /Managed Project/ })
    expect(link.getAttribute('href')).toBe(`/work/${project.slug}`)
  })

  it('renders a project case study by slug', async () => {
    const { setProjectsPublicClient, DEFAULT_PROJECT_RECORDS } = await import('@imba/plugin-projects')
    const project = { ...DEFAULT_PROJECT_RECORDS[0]!, name: 'Case Study Name', tagline: 'Case study tagline' }
    setProjectsPublicClient({
      listPublishedProjects: vi.fn().mockResolvedValue([project]),
      getPublishedProjectBySlug: vi.fn().mockResolvedValue(project),
    })
    const { Routes, Route } = await import('react-router-dom')
    const Project = cinema.pages!.find((p) => p.path === '/work/:slug')!.element
    render(
      <MemoryRouter initialEntries={[`/work/${project.slug}`]}>
        <Routes><Route path="/work/:slug" element={<Project />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Case Study Name')).toBeDefined()
    expect(screen.getByText('Case study tagline')).toBeDefined()
    expect(screen.getByText(project.content.problem.title)).toBeDefined()
  })

  it('renders the home hero from theme config so the pages plugin can drive it', async () => {
    const { ThemeProvider } = await import('@imba/core')
    const Home = cinema.pages!.find((p) => p.path === '/')!.element
    render(
      <MemoryRouter>
        <ThemeProvider
          template={cinema}
          site={{ name: 'Test', domain: 't.com', defaultLocale: 'en', locales: ['en'] }}
          resolvers={[async () => ({ home: { hero: { title: 'Managed hero headline' } } })]}
        >
          <Home />
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Managed hero headline')).toBeDefined()
    // Untouched sections keep the template defaults.
    expect(screen.getByText('Selected work')).toBeDefined()
  })
})

describe('@imba/template-cinema page SEO', () => {
  it('writes the CMS record’s SEO fields into the document once loaded', async () => {
    const { setPagesPublicClient, buildDefaultPageRecord } = await import('@imba/plugin-pages')
    const about = buildDefaultPageRecord('about')
    setPagesPublicClient({
      getPage: vi.fn().mockResolvedValue({ ...about, status: 'published', seoTitle: 'Managed SEO Title', seoDescription: 'Managed SEO description' }),
      listPages: vi.fn().mockResolvedValue([]),
    })
    const About = cinema.pages!.find((p) => p.path === '/about')!.element
    render(<MemoryRouter><About /></MemoryRouter>)
    await screen.findByText(about.content.title)
    await waitFor(() => expect(document.title).toContain('Managed SEO Title'))
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Managed SEO description')
  })
})

describe('@imba/template-cinema project route aliases', () => {
  it('redirects /projects and /projects/:slug (plugin-site default nav) to /work', async () => {
    const { Routes, Route, useLocation } = await import('react-router-dom')
    const Probe = () => <div data-testid="loc">{useLocation().pathname}</div>
    const alias = cinema.pages!.find((p) => p.path === '/projects/:slug')!.element
    const Alias = alias
    render(
      <MemoryRouter initialEntries={['/projects/quorum']}>
        <Routes>
          <Route path="/projects/:slug" element={<Alias />} />
          <Route path="/work/:slug" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('loc').textContent).toBe('/work/quorum')
  })
})
