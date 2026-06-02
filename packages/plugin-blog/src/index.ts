import { definePlugin } from '@imba/core'
import V001_blog from './migrations/V001_blog.sql?raw'
import { setBlogDb } from './public/blogClient'
import Blog from './public/Blog'
import BlogPost from './public/BlogPost'
import BlogAdmin from './admin/BlogAdmin'
import BlogCategoriesAdmin from './admin/BlogCategoriesAdmin'
import BlogPostEdit from './admin/BlogPostEdit'
import { seed } from './seed'

export default definePlugin({
  name: 'blog',
  version: '0.1.0',
  tablePrefix: 'blog_',
  routes: [
    { path: '/blog', element: Blog, seo: { title: 'Blog' } },
    { path: '/blog/:slug', element: BlogPost },
  ],
  admin: {
    nav: { group: 'Content', label: 'Blog', path: '/admin/blog', icon: 'FileText' },
    pages: [
      { path: '/admin/blog', element: BlogAdmin },
      { path: '/admin/blog/categories', element: BlogCategoriesAdmin },
      { path: '/admin/blog/new', element: BlogPostEdit },
      { path: '/admin/blog/edit/:id', element: BlogPostEdit },
    ],
  },
  migrations: [{ id: 'blog.V001', sql: V001_blog }],
  i18n: { en: { title: 'Blog' } },
  seed,
  register(ctx) {
    setBlogDb(ctx.db)
  },
})
