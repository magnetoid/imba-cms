import { describe, it, expect } from 'vitest'

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
})
