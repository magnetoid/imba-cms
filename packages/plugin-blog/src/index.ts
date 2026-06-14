import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import V001_blog from './migrations/V001_blog.sql?raw'
import V002_blog from './migrations/V002_blog.sql?raw'
import { createSupabaseBlogPublicClient, setBlogDb, setBlogPublicClient } from './public/blogClient'
import Blog from './public/Blog'
import BlogPost from './public/BlogPost'
import BlogAdmin from './admin/BlogAdmin'
import BlogCategoriesAdmin from './admin/BlogCategoriesAdmin'
import BlogPostEdit from './admin/BlogPostEdit'
import { seed } from './seed'

export {
  blogPublicClient,
  createSupabaseBlogPublicClient,
  setBlogPublicClient,
  type BlogPublicClient,
} from './public/blogClient'
export type { BlogPost, BlogCategory, BlogTag } from './types'

export default definePlugin({
  name: 'blog',
  version: '0.1.0',
  tablePrefix: 'blog_',
  routes: [
    { path: '/blog', element: Blog, seo: { title: 'Blog' } },
    { path: '/blog/:slug', element: BlogPost },
  ],
  admin: {
    nav: {
      group: 'Content',
      label: 'Blog',
      path: '/admin/blog',
      icon: 'FileText',
      requiredCapabilities: [CMS_CAPABILITIES.blogRead],
    },
    pages: [
      { path: '/admin/blog', element: BlogAdmin, requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
      { path: '/admin/blog/categories', element: BlogCategoriesAdmin, requiredCapabilities: [CMS_CAPABILITIES.blogCategoriesManage] },
      { path: '/admin/blog/new', element: BlogPostEdit, requiredCapabilities: [CMS_CAPABILITIES.blogWrite] },
      { path: '/admin/blog/edit/:id', element: BlogPostEdit, requiredCapabilities: [CMS_CAPABILITIES.blogWrite] },
    ],
  },
  migrations: [
    { id: 'blog.V001', sql: V001_blog },
    { id: 'blog.V002', sql: V002_blog },
  ],
  i18n: { en: { title: 'Blog' } },
  seed,
  register(ctx) {
    setBlogDb(ctx.db)
    setBlogPublicClient(createSupabaseBlogPublicClient(ctx.db))
  },
})
