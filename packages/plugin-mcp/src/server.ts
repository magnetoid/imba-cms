import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

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
] as const

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
export function buildMcpServer(db: Db): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION })

  // ── Resources (read path) ──────────────────────────────────────────────────
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

  // ── Query tools (read path) ────────────────────────────────────────────────
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

  server.registerTool(
    'blog_get_post',
    {
      title: 'Get a blog post by slug',
      description: 'Fetch a single blog post by its slug. Returns null if not found.',
      inputSchema: { slug: z.string().min(1).describe('The post slug') },
    },
    async ({ slug }) => json(await getPostBySlug(db, slug)),
  )

  server.registerTool(
    'blog_search_posts',
    {
      title: 'Search blog posts',
      description: 'Full-text-ish search of posts whose title or body matches the query (case-insensitive).',
      inputSchema: { query: z.string().min(1).describe('Substring to search for in title/body') },
    },
    async ({ query }) => json(await searchPosts(db, query)),
  )

  server.registerTool(
    'blog_list_categories',
    {
      title: 'List blog categories',
      description: 'List all blog categories, alphabetically by name.',
      inputSchema: {},
    },
    async () => json(await listCategories(db)),
  )

  // ── Write tools ────────────────────────────────────────────────────────────
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

  server.registerTool(
    'blog_delete_post',
    {
      title: 'Delete a blog post',
      description: 'Permanently delete a post by id.',
      inputSchema: { id: z.string().uuid().describe('The post id') },
    },
    async ({ id }) => json(await deletePost(db, id)),
  )

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

  return server
}
