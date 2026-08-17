import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BlogAuditLog from './BlogAuditLog'
import { setBlogDb } from '../public/blogClient'

/**
 * Two tables are queried: the audit log, then blog_posts for the titles of the
 * referenced ids (there is no FK, so PostgREST cannot embed them).
 */
function stubDb(rows: unknown[], posts: Array<{ id: string; title: string; slug: string }> = []) {
  const audit = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
  }
  const postsChain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn(),
  }
  postsChain.in.mockImplementation(async () => ({ data: posts, error: null }))
  const from = vi.fn((table: string) => (table === 'blog_posts' ? postsChain : audit))
  setBlogDb({ from } as never)
  return { from, chain: audit, postsChain }
}

describe('BlogAuditLog', () => {
  it('lists audit events across posts with actor and status transition', async () => {
    const { from, chain, postsChain } = stubDb([
      { id: 'a1', post_id: 'p1', event_type: 'status_changed', actor_email: 'reviewer@example.com', status: 'published', metadata: { previous_status: 'in_review', next_status: 'published' }, created_at: '2026-05-01T10:00:00Z' },
      { id: 'a2', post_id: 'p2', event_type: 'deleted', actor_email: null, status: null, metadata: {}, created_at: '2026-05-01T09:00:00Z' },
    ], [{ id: 'p1', title: 'Hello World', slug: 'hello-world' }])
    render(<MemoryRouter><BlogAuditLog /></MemoryRouter>)
    expect(await screen.findByTestId('audit-row-a1')).toBeDefined()
    expect(from).toHaveBeenCalledWith('blog_post_audit_log')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    // No PostgREST embed — the audit table has no FK to blog_posts.
    expect(chain.select.mock.calls[0]![0]).not.toMatch(/blog_posts\(/)
    expect(postsChain.in).toHaveBeenCalledWith('id', ['p1', 'p2'])
    expect(screen.getByRole('link', { name: 'Hello World' }).getAttribute('href')).toBe('/admin/blog/edit/p1')
    expect(screen.getByText('in_review → published')).toBeDefined()
    expect(screen.getByText('reviewer@example.com')).toBeDefined()
    expect(screen.getByText('Deleted post')).toBeDefined()
  })

  it('shows an empty state when there is no activity', async () => {
    stubDb([])
    render(<MemoryRouter><BlogAuditLog /></MemoryRouter>)
    expect(await screen.findByText(/No activity recorded yet/)).toBeDefined()
  })
})
