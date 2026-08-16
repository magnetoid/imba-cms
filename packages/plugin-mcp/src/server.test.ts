import { describe, it, expect } from 'vitest'
import { CMS_CAPABILITIES } from '@imba/core/node'

import { buildMcpServer, TOOL_NAMES } from './server.js'
import type { Db } from './entities/blog.js'

// Minimal stub: buildMcpServer only wires handlers; it never touches the db at
// construction time, so an empty object suffices for these structural checks.
const stubDb = { from: () => ({}) } as unknown as Db

describe('buildMcpServer', () => {
  it('constructs an McpServer without throwing', () => {
    const server = buildMcpServer(stubDb)
    expect(server).toBeDefined()
    expect(typeof server.connect).toBe('function')
  })

  it('registers exactly the allowlisted tool names', () => {
    const server = buildMcpServer(stubDb)
    // The SDK keeps registered tools in a private `_registeredTools` map.
    const registered = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    expect(registered).toBeDefined()
    const names = Object.keys(registered).sort()
    expect(names).toEqual([...TOOL_NAMES].sort())
  })

  it('registers the blog read resources', () => {
    const server = buildMcpServer(stubDb)
    const inner = server as unknown as {
      _registeredResources: Record<string, unknown>
      _registeredResourceTemplates: Record<string, unknown>
    }
    // static resource: posts list; templated resource: single post by slug
    expect(Object.keys(inner._registeredResources).length).toBeGreaterThanOrEqual(1)
    expect(Object.keys(inner._registeredResourceTemplates).length).toBeGreaterThanOrEqual(1)
  })

  it('filters write tools when only read capability is allowed', () => {
    const server = buildMcpServer(stubDb, {
      allowedCapabilities: [CMS_CAPABILITIES.blogRead],
    })
    const registered = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    expect(Object.keys(registered).sort()).toEqual([
      'blog_get_post',
      'blog_list_categories',
      'blog_list_posts',
      'blog_search_posts',
    ])
  })

  it('exposes publish tooling only when publish capability is allowed', () => {
    const server = buildMcpServer(stubDb, {
      allowedCapabilities: [CMS_CAPABILITIES.blogRead, CMS_CAPABILITIES.blogPublish],
    })
    const registered = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    expect(Object.keys(registered)).toContain('blog_set_published')
    expect(Object.keys(registered)).not.toContain('blog_delete_post')
    expect(Object.keys(registered)).not.toContain('blog_create_post')
  })
})

describe('buildMcpServer content tools', () => {
  const names = (server: ReturnType<typeof buildMcpServer>) =>
    Object.keys((server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools).sort()

  it('exposes pages, projects and site tools by default alongside blog', () => {
    const registered = names(buildMcpServer(stubDb))
    expect(registered).toEqual(expect.arrayContaining([
      'pages_list', 'pages_get', 'pages_update', 'pages_set_status',
      'projects_list', 'projects_get', 'projects_create', 'projects_update', 'projects_delete', 'projects_set_status',
      'site_get_settings', 'site_update_settings', 'site_set_status',
    ]))
  })

  it('gates each family on its own capabilities', () => {
    const readOnly = names(buildMcpServer(stubDb, {
      allowedCapabilities: [CMS_CAPABILITIES.pagesRead, CMS_CAPABILITIES.projectsRead, CMS_CAPABILITIES.siteRead],
    }))
    expect(readOnly).toEqual(['pages_get', 'pages_list', 'projects_get', 'projects_list', 'site_get_settings'])

    const publisher = names(buildMcpServer(stubDb, { allowedCapabilities: [CMS_CAPABILITIES.pagesPublish] }))
    expect(publisher).toEqual(['pages_set_status'])
  })
})
