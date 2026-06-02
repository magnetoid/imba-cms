import { describe, it, expect } from 'vitest'
import blog from './index'
import { blogDb } from './public/blogClient'

describe('@imba/plugin-blog manifest', () => {
  it('declares name, version, prefix, public + admin routes, and a migration', () => {
    expect(blog.name).toBe('blog')
    expect(blog.tablePrefix).toBe('blog_')
    expect(blog.routes?.some((r) => r.path === '/blog')).toBe(true)
    expect(blog.admin?.nav.path).toBe('/admin/blog')
    expect(blog.migrations?.[0].id).toBe('blog.V001')
  })

  it('register() initializes the blog db seam', () => {
    const fakeDb = { from: () => ({}) } as never
    blog.register?.({ db: fakeDb, auth: {} as never, config: {} as never })
    expect(blogDb()).toBe(fakeDb)
  })
})
