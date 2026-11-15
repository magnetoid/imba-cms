import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import mtio from './index'
import { CASE_STUDIES, caseStudyTrack } from './data/case-studies'
import { SERVICES } from './data/services'
import { MENUS } from './data/site'

// jsdom logs a noisy "Not implemented" for scrollTo; the layout calls it on every navigation.
window.scrollTo = () => {}

const paths = (mtio.pages ?? []).map((p) => p.path)

describe('@imba/template-mtio', () => {
  it('is a valid Template with a Public layout and a home page', () => {
    expect(mtio.name).toBe('mtio')
    expect(typeof mtio.layouts.Public).toBe('function')
    expect(paths).toContain('/')
    expect(mtio.expects).toContain('blog')
  })

  it('Public layout renders its children', () => {
    const Public = mtio.layouts.Public
    render(
      <MemoryRouter>
        <Public>
          <div>CHILD</div>
        </Public>
      </MemoryRouter>,
    )
    expect(screen.getByText('CHILD')).toBeDefined()
  })

  it('has two menus, and every menu link points at a real page', () => {
    expect(MENUS.map((m) => m.id)).toEqual(['build', 'marketing'])
    for (const menu of MENUS) {
      for (const link of menu.links) expect(paths).toContain(link.to)
    }
  })

  it('opens a menu from its button and lists its links', () => {
    const Public = mtio.layouts.Public
    render(
      <MemoryRouter>
        <Public />
      </MemoryRouter>,
    )
    const button = screen.getByRole('button', { name: /Marketing & Services/ })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('AI automation, e-commerce, ads and tracking, SEO, video')).toBeDefined()
  })

  it('every page renders inside the layout without throwing', () => {
    const Public = mtio.layouts.Public
    for (const page of mtio.pages ?? []) {
      const Page = page.element
      const { unmount } = render(
        <MemoryRouter initialEntries={[page.path.replace(':slug', CASE_STUDIES[0].slug)]}>
          <Public>
            <Page />
          </Public>
        </MemoryRouter>,
      )
      expect(document.querySelector('main')?.textContent?.length ?? 0).toBeGreaterThan(50)
      unmount()
    }
  })
})

describe('template content', () => {
  it('case-study slugs are unique and both tracks have studies', () => {
    const slugs = CASE_STUDIES.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(CASE_STUDIES.some((c) => caseStudyTrack(c) === 'build')).toBe(true)
    expect(CASE_STUDIES.some((c) => caseStudyTrack(c) === 'marketing')).toBe(true)
  })

  it('every service proof link points at an existing case study', () => {
    const slugs = new Set(CASE_STUDIES.map((c) => c.slug))
    for (const service of SERVICES) {
      for (const proof of service.proof) expect(slugs.has(proof.slug)).toBe(true)
    }
  })
})
