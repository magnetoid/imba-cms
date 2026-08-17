import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, mergeThemeConfig, useThemeConfig } from './theme'
import { defineTemplate } from './define'
import type { SiteConfig, ThemeConfig } from './types'

const site: SiteConfig = { name: 'Static Name', domain: 't.com', defaultLocale: 'en', locales: ['en'] }
const template = defineTemplate({
  name: 't',
  layouts: { Public: ({ children }: { children?: React.ReactNode }) => <>{children}</> },
  theme: { defaults: { brand: { name: 'Template Default', accent: 'Studio' }, navLinks: [{ label: 'Work', to: '/work' }] } },
})

function Probe() {
  const theme = useThemeConfig()
  return (
    <div>
      <span data-testid="brand">{theme.brand?.name}</span>
      <span data-testid="accent">{theme.brand?.accent}</span>
      <span data-testid="nav">{theme.navLinks?.map((l) => l.label).join(',')}</span>
    </div>
  )
}

describe('ThemeProvider runtime resolvers', () => {
  it('starts from the static merge and then applies what plugins resolve at runtime', async () => {
    let release: (value: ThemeConfig | undefined) => void = () => {}
    const pending = new Promise<ThemeConfig | undefined>((resolve) => { release = resolve })

    render(
      <ThemeProvider template={template} site={site} resolvers={[() => pending]}>
        <Probe />
      </ThemeProvider>,
    )
    // Before the resolver settles the code-level defaults render.
    expect(screen.getByTestId('brand').textContent).toBe('Template Default')

    release({ brand: { name: 'From CMS' }, navLinks: [{ label: 'About', to: '/about' }] })

    await waitFor(() => expect(screen.getByTestId('brand').textContent).toBe('From CMS'))
    // A partial resolve keeps unspecified defaults (accent came from the template).
    expect(screen.getByTestId('accent').textContent).toBe('Studio')
    // Arrays replace rather than concatenate.
    expect(screen.getByTestId('nav').textContent).toBe('About')
  })

  it('lets CMS-managed values win over the code-level site.theme override', async () => {
    render(
      <ThemeProvider
        template={template}
        site={{ ...site, theme: { brand: { name: 'Code Override' } } }}
        resolvers={[async () => ({ brand: { name: 'From CMS' } })]}
      >
        <Probe />
      </ThemeProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('brand').textContent).toBe('From CMS'))
  })

  it('keeps the static config when a resolver fails or returns nothing', async () => {
    render(
      <ThemeProvider
        template={template}
        site={site}
        resolvers={[async () => { throw new Error('network') }, async () => undefined]}
      >
        <Probe />
      </ThemeProvider>,
    )
    // Give the effect a tick to settle, then assert nothing regressed.
    await new Promise((r) => setTimeout(r, 10))
    expect(screen.getByTestId('brand').textContent).toBe('Template Default')
  })

  it('applies resolvers in order so later plugins override earlier ones', async () => {
    render(
      <ThemeProvider
        template={template}
        site={site}
        resolvers={[async () => ({ brand: { name: 'first' } }), async () => ({ brand: { name: 'second' } })]}
      >
        <Probe />
      </ThemeProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('brand').textContent).toBe('second'))
  })
})

describe('ThemeProvider derived fields', () => {
  it('exposes the site name separately from the brand wordmark', async () => {
    function NameProbe() {
      const theme = useThemeConfig()
      return <span data-testid="site-name">{theme.siteName}</span>
    }
    render(
      <ThemeProvider template={template} site={site}>
        <NameProbe />
      </ThemeProvider>,
    )
    // brand.name is 'Template Default' here; siteName stays the SiteConfig name
    // so document titles match what the route-level SEO uses.
    expect(screen.getByTestId('site-name').textContent).toBe('Static Name')
  })
})

describe('mergeThemeConfig', () => {
  it('deep-merges brand and replaces link arrays', () => {
    const merged = mergeThemeConfig(
      { brand: { name: 'a', accent: 'x' }, navLinks: [{ label: 'A', to: '/a' }] },
      { brand: { name: 'b' }, navLinks: [{ label: 'B', to: '/b' }] },
    )
    expect(merged.brand).toEqual({ name: 'b', accent: 'x' })
    expect(merged.navLinks).toEqual([{ label: 'B', to: '/b' }])
  })
})
