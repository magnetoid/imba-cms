import { lazy } from 'react'
import { CMS_CAPABILITIES, definePlugin, readBrowserRuntimeOptionalValue } from '@imba/core'
import V001_blog from './migrations/V001_blog.sql?raw'
import V002_blog from './migrations/V002_blog.sql?raw'
import V003_blog from './migrations/V003_blog_rbac.sql?raw'
import { createHttpBlogPublicClient, createSupabaseBlogPublicClient, setBlogDb, setBlogPublicClient } from './public/blogClient'
import { seed } from './seed'

const Blog = lazy(async () => import('./public/Blog'))
const BlogPost = lazy(async () => import('./public/BlogPost'))
const BlogAdmin = lazy(async () => import('./admin/BlogAdmin'))
const BlogCategoriesAdmin = lazy(async () => import('./admin/BlogCategoriesAdmin'))
const BlogPostEdit = lazy(async () => import('./admin/BlogPostEdit'))
const BlogAuditLog = lazy(async () => import('./admin/BlogAuditLog'))

export {
  blogPublicClient,
  createHttpBlogPublicClient,
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
      requiredCapabilities: [CMS_CAPABILITIES.blogRead],
    },
    pages: [
      { path: '/admin/blog', element: BlogAdmin, requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
      { path: '/admin/blog/categories', element: BlogCategoriesAdmin, requiredCapabilities: [CMS_CAPABILITIES.blogCategoriesManage] },
      { path: '/admin/blog/audit', element: BlogAuditLog, requiredCapabilities: [CMS_CAPABILITIES.auditRead] },
      { path: '/admin/blog/new', element: BlogPostEdit, requiredCapabilities: [CMS_CAPABILITIES.blogWrite] },
      { path: '/admin/blog/edit/:id', element: BlogPostEdit, requiredCapabilities: [CMS_CAPABILITIES.blogWrite] },
    ],
  },
  migrations: [
    { id: 'blog.V001', sql: V001_blog },
    { id: 'blog.V002', sql: V002_blog },
    { id: 'blog.V003', sql: V003_blog },
  ],
  i18n: { en: { title: 'Blog' } },
  seed,
  register(ctx) {
    setBlogDb(ctx.db)
    const contentApiUrl = readBrowserRuntimeOptionalValue('IMBA_CONTENT_API_URL')
    const previewToken = readBrowserRuntimeOptionalValue('IMBA_CONTENT_PREVIEW_TOKEN')

    if (contentApiUrl) {
      setBlogPublicClient(createHttpBlogPublicClient({ baseUrl: contentApiUrl, previewToken }))
      return
    }

    setBlogPublicClient(createSupabaseBlogPublicClient(ctx.db))
  },
})
