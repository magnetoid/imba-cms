import { createServer } from 'node:http'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSettingsHttpHandler } from './server.js'

function makeDb() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [{ id: '1', slug: 'hello-world', published: true, status: 'published' }],
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id: '1', slug: 'hello-world', published: false, status: 'draft' },
      error: null,
    }),
  }

  return {
    from: vi.fn().mockReturnValue(chain),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '1', app_metadata: { permissions: ['blog.read', 'settings.manage'] } } },
        error: null,
      }),
    },
  }
}

let activeServer: ReturnType<typeof createServer> | null = null

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!activeServer) {
      resolve()
      return
    }
    activeServer.close((error) => {
      activeServer = null
      if (error) reject(error)
      else resolve()
    })
  })
})

async function startTestServer(corsOrigin: '*' | readonly string[] = '*') {
  const db = makeDb()
  const server = createServer(createSettingsHttpHandler(db as never, {
    corsOrigin,
    previewTokenSecret: 'secret',
  }))
  activeServer = server

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server')
  return { db, baseUrl: `http://127.0.0.1:${address.port}` }
}

describe('settings server content routes', () => {
  it('serves published blog posts without auth', async () => {
    const { baseUrl } = await startTestServer()
    const response = await fetch(`${baseUrl}/api/content/blog/posts`)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.items).toHaveLength(1)
  })

  it('issues preview tokens for authorized users', async () => {
    const { baseUrl } = await startTestServer()
    const response = await fetch(`${baseUrl}/api/content/blog/preview-token`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug: 'hello-world', expiresInSeconds: 60 }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(typeof payload.token).toBe('string')
    expect(payload.token.length).toBeGreaterThan(10)
  })
})

describe('cors allowlist', () => {
  it('echoes back an allowed origin and varies on it', async () => {
    const { baseUrl } = await startTestServer(['https://cms.example'])
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://cms.example' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('https://cms.example')
    expect(response.headers.get('vary')).toBe('Origin')
  })

  it('sends no allow-origin header for a disallowed origin', async () => {
    const { baseUrl } = await startTestServer(['https://cms.example'])
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://evil.example' },
    })

    // The response body still arrives over the wire; the missing header is what
    // stops the calling page from reading it.
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('still supports an explicit wildcard policy', async () => {
    const { baseUrl } = await startTestServer('*')
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://anything.example' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })
})

describe('removed github build webhook', () => {
  it('no longer exposes an unauthenticated build trigger', async () => {
    const { baseUrl } = await startTestServer()
    const response = await fetch(`${baseUrl}/api/webhook/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'refs/heads/main' }),
    })

    // Unauthenticated POSTs fall through to the bearer gate, never to a shell.
    expect(response.status).toBe(401)
  })

  it('never imports node:child_process anywhere in the package', async () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    // Source files only — this spec names the forbidden APIs in its own assertion.
    const files = (await readdir(dir)).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.test.ts'),
    )
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const source = await readFile(join(dir, file), 'utf8')
      expect(source, `${file} must not be able to spawn processes`).not.toMatch(
        /child_process|\bexecFile\b|\bspawn\(/,
      )
    }
  })
})
