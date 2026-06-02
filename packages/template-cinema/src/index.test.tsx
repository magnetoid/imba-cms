import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
