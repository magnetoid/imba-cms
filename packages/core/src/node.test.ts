// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * `@imba/core/node` is the entry point the Node binaries compile against. It
 * must stay free of React and of Vite-only `?raw` imports: the main entry pulls
 * both, which is why `@imba/settings-server` previously emitted a `dist/` that
 * Node could not load at all.
 *
 * These assertions are on the source graph rather than the build output so they
 * fail fast, in the unit suite, rather than at release time.
 */

const SRC = dirname(fileURLToPath(import.meta.url))

/** Files reachable from node.ts. Kept explicit so adding one is a decision. */
const NODE_GRAPH = ['node.ts', 'permissions.ts', 'settingsContracts.ts', 'types.ts', 'writeErrors.ts']

function read(file: string): string {
  return readFileSync(join(SRC, file), 'utf8')
}

/** Comments are stripped so prose describing these rules cannot trip them. */
function code(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Value imports only. `import type { ComponentType } from 'react'` in types.ts
 * is erased at compile time — verified: the emitted types.js has no reference
 * to react — so it does not put React in the Node runtime graph.
 */
function valueImportsOf(source: string): string[] {
  return [...source.matchAll(/^\s*import\s+(?!type\b)([\s\S]*?)from\s+['"]([^'"]+)['"]/gm)].map(
    (m) => m[2]!,
  )
}

describe('@imba/core/node source graph', () => {
  it.each(NODE_GRAPH)('%s contains no bundler-only ?raw import', (file) => {
    expect(code(file)).not.toMatch(/\?raw/)
  })

  it.each(NODE_GRAPH)('%s does not pull React or the router into the runtime graph', (file) => {
    for (const specifier of valueImportsOf(code(file))) {
      expect(specifier, `${file} value-imports ${specifier}`).not.toMatch(/^react/)
    }
  })

  it('only imports from within its own declared graph', () => {
    // A relative import outside NODE_GRAPH would silently widen what the Node
    // binaries compile — the exact failure mode this entry point exists to stop.
    const relative = [...read('node.ts').matchAll(/from '\.\/([A-Za-z0-9_]+)\.js'/g)].map(
      (m) => `${m[1]}.ts`,
    )

    expect(relative.length).toBeGreaterThan(0)
    for (const file of relative) expect(NODE_GRAPH).toContain(file)
  })

  it('exposes what the server packages actually consume', async () => {
    const mod = await import('./node')

    for (const name of [
      'CMS_CAPABILITIES',
      'ROLE_CAPABILITIES',
      'resolveCapabilities',
      'hasCapabilities',
      'parseCmsRole',
      'graphqlSettingsSchema',
      'mcpSettingsSchema',
    ]) {
      expect(mod, `@imba/core/node must export ${name}`).toHaveProperty(name)
    }
  })
})
