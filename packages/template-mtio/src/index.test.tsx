import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import mtio from './index'

describe('@imba/template-mtio', () => {
  it('is a valid Template with a Public layout and a home page', () => {
    expect(mtio.name).toBe('mtio')
    expect(typeof mtio.layouts.Public).toBe('function')
    expect(mtio.pages?.some((p) => p.path === '/')).toBe(true)
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
})
