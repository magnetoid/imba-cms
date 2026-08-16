import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { CMS_CAPABILITIES, hasCapabilities } from '@imba/core/node'
import type { CapabilityRequirement } from '@imba/core/node'

import { DEFAULT_MCP_CAPABILITIES } from './config.js'
import {
  type Db,
  blogStatusSchema,
  listPosts,
  getPostBySlug,
  searchPosts,
  listCategories,
  createPost,
  updatePost,
  deletePost,
  setPublished,
} from './entities/blog.js'
import {
  contentStatusSchema,
  createProject,
  deleteProject,
  getPage,
  getProject,
  getSiteSettings,
  listPages,
  listProjects,
  setPageStatus,
  setProjectStatus,
  setSiteStatus,
  updatePage,
  updateProject,
  updateSiteSettings,
} from './entities/content.js'

export const SERVER_NAME = 'imba-mcp'
export const SERVER_VERSION = '0.1.0'

/** Names of every tool exposed by the v1 allowlist. */
export const TOOL_NAMES = [
  'blog_list_posts',
  'blog_get_post',
  'blog_search_posts',
  'blog_create_post',
  'blog_update_post',
  'blog_delete_post',
  'blog_set_published',
  'blog_list_categories',
  'pages_list',
  'pages_get',
  'pages_update',
  'pages_set_status',
  'projects_list',
  'projects_get',
  'projects_create',
  'projects_update',
  'projects_delete',
  'projects_set_status',
  'site_get_settings',
  'site_update_settings',
  'site_set_status',
] as const

const RESOURCE_REQUIREMENTS = {
  blogPosts: [CMS_CAPABILITIES.blogRead],
  blogPost: [CMS_CAPABILITIES.blogRead],
} as const satisfies Record<string, CapabilityRequirement>

const TOOL_REQUIREMENTS = {
  blog_list_posts: [CMS_CAPABILITIES.blogRead],
  blog_get_post: [CMS_CAPABILITIES.blogRead],
  blog_search_posts: [CMS_CAPABILITIES.blogRead],
  blog_create_post: [CMS_CAPABILITIES.blogWrite],
  blog_update_post: [CMS_CAPABILITIES.blogWrite],
  blog_delete_post: [CMS_CAPABILITIES.blogDelete],
  blog_set_published: [CMS_CAPABILITIES.blogPublish],
  blog_list_categories: [CMS_CAPABILITIES.blogRead],
  pages_list: [CMS_CAPABILITIES.pagesRead],
  pages_get: [CMS_CAPABILITIES.pagesRead],
  pages_update: [CMS_CAPABILITIES.pagesWrite],
  pages_set_status: [CMS_CAPABILITIES.pagesPublish],
  projects_list: [CMS_CAPABILITIES.projectsRead],
  projects_get: [CMS_CAPABILITIES.projectsRead],
  projects_create: [CMS_CAPABILITIES.projectsWrite],
  projects_update: [CMS_CAPABILITIES.projectsWrite],
  // No projects.delete capability exists; deletion rides on write, as the
  // admin's RLS does.
  projects_delete: [CMS_CAPABILITIES.projectsWrite],
  projects_set_status: [CMS_CAPABILITIES.projectsPublish],
  site_get_settings: [CMS_CAPABILITIES.siteRead],
  site_update_settings: [CMS_CAPABILITIES.siteWrite],
  site_set_status: [CMS_CAPABILITIES.sitePublish],
} as const satisfies Record<(typeof TOOL_NAMES)[number], CapabilityRequirement>

const json = (result: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
})

/**
 * Builds (but does not connect) an MCP server exposing the blog allowlist.
 *
 * Read paths are exposed both as MCP **resources** (posts list + single post by
 * slug) and as **tools** (so agents that only support tool-calling can still
 * read). Write paths are tools only. Every handler delegates to the pure
 * `entities/blog.ts` functions; the service-role key never crosses this boundary.
 */
export function buildMcpServer(
  db: Db,
  options: { allowedCapabilities?: CapabilityRequirement } = {},
): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION })
  const capabilityContext = {
    id: 'mcp-server',
    app_metadata: {
      permissions: [...(options.allowedCapabilities ?? DEFAULT_MCP_CAPABILITIES)],
    },
  }
  const canExpose = (requirements: CapabilityRequirement) => hasCapabilities(capabilityContext, requirements)

  // ── Resources (read path) ──────────────────────────────────────────────────
  if (canExpose(RESOURCE_REQUIREMENTS.blogPosts)) {
    server.registerResource(
      'blog-posts',
      'imba://blog/posts',
      {
        title: 'Blog posts',
        description: 'All blog posts as JSON, newest first.',
        mimeType: 'application/json',
      },
      async (uri) => {
        const posts = await listPosts(db, {})
        return {
          contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(posts, null, 2) }],
        }
      },
    )
  }

  if (canExpose(RESOURCE_REQUIREMENTS.blogPost)) {
    server.registerResource(
      'blog-post',
      new ResourceTemplate('imba://blog/posts/{slug}', { list: undefined }),
      {
        title: 'Blog post by slug',
        description: 'A single blog post addressed by its slug.',
        mimeType: 'application/json',
      },
      async (uri, variables) => {
        const slugVar = Array.isArray(variables.slug) ? variables.slug[0] : variables.slug
        const post = await getPostBySlug(db, String(slugVar))
        return {
          contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(post, null, 2) }],
        }
      },
    )
  }

  // ── Query tools (read path) ────────────────────────────────────────────────
  if (canExpose(TOOL_REQUIREMENTS.blog_list_posts)) {
    server.registerTool(
      'blog_list_posts',
      {
        title: 'List blog posts',
        description: 'List blog posts, newest first. Optionally filter by status and cap with limit.',
        inputSchema: {
          status: blogStatusSchema.optional().describe('Filter by status: draft | published | scheduled'),
          limit: z.number().int().positive().max(200).optional().describe('Max number of posts to return'),
        },
      },
      async (args) => json(await listPosts(db, args)),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_get_post)) {
    server.registerTool(
      'blog_get_post',
      {
        title: 'Get a blog post by slug',
        description: 'Fetch a single blog post by its slug. Returns null if not found.',
        inputSchema: { slug: z.string().min(1).describe('The post slug') },
      },
      async ({ slug }) => json(await getPostBySlug(db, slug)),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_search_posts)) {
    server.registerTool(
      'blog_search_posts',
      {
        title: 'Search blog posts',
        description: 'Full-text-ish search of posts whose title or body matches the query (case-insensitive).',
        inputSchema: { query: z.string().min(1).describe('Substring to search for in title/body') },
      },
      async ({ query }) => json(await searchPosts(db, query)),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_list_categories)) {
    server.registerTool(
      'blog_list_categories',
      {
        title: 'List blog categories',
        description: 'List all blog categories, alphabetically by name.',
        inputSchema: {},
      },
      async () => json(await listCategories(db)),
    )
  }

  // ── Write tools ────────────────────────────────────────────────────────────
  if (canExpose(TOOL_REQUIREMENTS.blog_create_post)) {
    server.registerTool(
      'blog_create_post',
      {
        title: 'Create a blog post',
        description: 'Create a new blog post. Requires at least title and slug.',
        inputSchema: {
          title: z.string().min(1),
          slug: z.string().min(1).describe('Lowercase kebab-case unique slug'),
          excerpt: z.string().nullable().optional(),
          body: z.string().nullable().optional(),
          category: z.string().nullable().optional(),
          category_id: z.string().uuid().nullable().optional(),
          tags: z.array(z.string()).optional(),
          status: blogStatusSchema.optional(),
          published: z.boolean().optional(),
          seo_title: z.string().nullable().optional(),
          seo_description: z.string().nullable().optional(),
          cover_image_url: z.string().nullable().optional(),
          featured_image_url: z.string().nullable().optional(),
          og_image_url: z.string().nullable().optional(),
          author_name: z.string().nullable().optional(),
          read_time_minutes: z.number().int().nonnegative().nullable().optional(),
        },
      },
      async (input) => json(await createPost(db, input)),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_update_post)) {
    server.registerTool(
      'blog_update_post',
      {
        title: 'Update a blog post',
        description: 'Update an existing post by id. Provide a patch object with the fields to change.',
        inputSchema: {
          id: z.string().uuid().describe('The post id'),
          patch: z
            .object({
              title: z.string().min(1).optional(),
              slug: z.string().min(1).optional(),
              excerpt: z.string().nullable().optional(),
              body: z.string().nullable().optional(),
              category: z.string().nullable().optional(),
              category_id: z.string().uuid().nullable().optional(),
              tags: z.array(z.string()).optional(),
              status: blogStatusSchema.optional(),
              published: z.boolean().optional(),
              seo_title: z.string().nullable().optional(),
              seo_description: z.string().nullable().optional(),
              cover_image_url: z.string().nullable().optional(),
              featured_image_url: z.string().nullable().optional(),
              og_image_url: z.string().nullable().optional(),
              author_name: z.string().nullable().optional(),
              read_time_minutes: z.number().int().nonnegative().nullable().optional(),
            })
            .describe('Fields to change'),
        },
      },
      async ({ id, patch }) => json(await updatePost(db, { id, patch })),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_delete_post)) {
    server.registerTool(
      'blog_delete_post',
      {
        title: 'Delete a blog post',
        description: 'Permanently delete a post by id.',
        inputSchema: { id: z.string().uuid().describe('The post id') },
      },
      async ({ id }) => json(await deletePost(db, id)),
    )
  }

  if (canExpose(TOOL_REQUIREMENTS.blog_set_published)) {
    server.registerTool(
      'blog_set_published',
      {
        title: 'Publish or unpublish a post',
        description:
          'Set a post published or unpublished by id. Publishing stamps published_at and status; unpublishing clears them.',
        inputSchema: {
          id: z.string().uuid().describe('The post id'),
          published: z.boolean().describe('true to publish, false to unpublish'),
        },
      },
      async ({ id, published }) => json(await setPublished(db, { id, published })),
    )
  }

  // ── Pages ──────────────────────────────────────────────────────────────────
  const jsonContent = z.record(z.unknown()).describe(
    'Structured page content. Must match the shape the pages plugin defines for this slug (see @imba/plugin-pages types).',
  )

  if (canExpose(TOOL_REQUIREMENTS.pages_list)) {
    server.registerTool(
      'pages_list',
      {
        title: 'List site pages',
        description: 'List the CMS-managed pages (home, about, services, contact) with status and content.',
        inputSchema: { status: contentStatusSchema.optional().describe('Filter: draft | published') },
      },
      async (args) => json(await listPages(db, args)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.pages_get)) {
    server.registerTool(
      'pages_get',
      {
        title: 'Get a page by slug',
        description: 'Fetch one page (home | about | services | contact). Returns null if not found.',
        inputSchema: { slug: z.string().min(1).describe('The page slug') },
      },
      async ({ slug }) => json(await getPage(db, slug)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.pages_update)) {
    server.registerTool(
      'pages_update',
      {
        title: 'Update a page',
        description: 'Change a page\'s title, SEO fields or structured content. Does not change publish status.',
        inputSchema: {
          slug: z.string().min(1),
          patch: z.object({
            title: z.string().min(1).optional(),
            seo_title: z.string().nullable().optional(),
            seo_description: z.string().nullable().optional(),
            content: jsonContent.optional(),
          }).describe('Fields to change'),
        },
      },
      async ({ slug, patch }) => json(await updatePage(db, { slug, patch })),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.pages_set_status)) {
    server.registerTool(
      'pages_set_status',
      {
        title: 'Publish or unpublish a page',
        description: 'Set a page to published (stamps published_at) or draft.',
        inputSchema: { slug: z.string().min(1), status: contentStatusSchema },
      },
      async ({ slug, status }) => json(await setPageStatus(db, { slug, status })),
    )
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  const projectFields = {
    name: z.string().min(1),
    slug: z.string().min(1).describe('Lowercase kebab-case unique slug'),
    url: z.string().optional(),
    year: z.string().optional(),
    category: z.string().optional(),
    tagline: z.string().optional(),
    hero: z.string().optional().describe('Hero paragraph shown on the case study'),
    summary: z.string().optional(),
    accent: z.string().optional().describe('Accent colour, e.g. #10B981'),
    featured: z.boolean().optional(),
    sort_order: z.number().int().optional(),
    status: contentStatusSchema.optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    content: z.record(z.unknown()).optional().describe('Case-study body; must match @imba/plugin-projects projectContentSchema'),
  }

  if (canExpose(TOOL_REQUIREMENTS.projects_list)) {
    server.registerTool(
      'projects_list',
      {
        title: 'List projects',
        description: 'List portfolio projects in sort order. Filter by status and featured, cap with limit.',
        inputSchema: {
          status: contentStatusSchema.optional(),
          featured: z.boolean().optional(),
          limit: z.number().int().positive().max(200).optional(),
        },
      },
      async (args) => json(await listProjects(db, args)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.projects_get)) {
    server.registerTool(
      'projects_get',
      {
        title: 'Get a project by slug',
        description: 'Fetch one project case study by slug. Returns null if not found.',
        inputSchema: { slug: z.string().min(1) },
      },
      async ({ slug }) => json(await getProject(db, slug)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.projects_create)) {
    server.registerTool(
      'projects_create',
      { title: 'Create a project', description: 'Create a project. Requires name and slug; drafts by default.', inputSchema: projectFields },
      async (input) => json(await createProject(db, input)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.projects_update)) {
    server.registerTool(
      'projects_update',
      {
        title: 'Update a project',
        description: 'Update a project by id with a patch of the fields to change.',
        inputSchema: { id: z.string().uuid(), patch: z.object(projectFields).partial().describe('Fields to change') },
      },
      async ({ id, patch }) => json(await updateProject(db, { id, patch })),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.projects_delete)) {
    server.registerTool(
      'projects_delete',
      { title: 'Delete a project', description: 'Permanently delete a project by id.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => json(await deleteProject(db, id)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.projects_set_status)) {
    server.registerTool(
      'projects_set_status',
      {
        title: 'Publish or unpublish a project',
        description: 'Set a project to published (stamps published_at) or draft.',
        inputSchema: { id: z.string().uuid(), status: contentStatusSchema },
      },
      async ({ id, status }) => json(await setProjectStatus(db, { id, status })),
    )
  }

  // ── Site settings ──────────────────────────────────────────────────────────
  if (canExpose(TOOL_REQUIREMENTS.site_get_settings)) {
    server.registerTool(
      'site_get_settings',
      {
        title: 'Get site settings',
        description: 'The primary site settings row: brand, navigation, footer and its publish status.',
        inputSchema: {},
      },
      async () => json(await getSiteSettings(db)),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.site_update_settings)) {
    server.registerTool(
      'site_update_settings',
      {
        title: 'Update site settings',
        description: 'Change the site settings title or structured content (must match @imba/plugin-site siteSettingsContentSchema).',
        inputSchema: {
          patch: z.object({ title: z.string().min(1).optional(), content: z.record(z.unknown()).optional() }).describe('Fields to change'),
        },
      },
      async ({ patch }) => json(await updateSiteSettings(db, { patch })),
    )
  }
  if (canExpose(TOOL_REQUIREMENTS.site_set_status)) {
    server.registerTool(
      'site_set_status',
      {
        title: 'Publish or unpublish site settings',
        description: 'Publish the site settings so the public site picks them up, or revert them to draft.',
        inputSchema: { status: contentStatusSchema },
      },
      async ({ status }) => json(await setSiteStatus(db, { status })),
    )
  }

  return server
}
