import { createServer } from 'node:http'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSettingsHttpHandler } from './server.js'
import { clearServerSubjectCache } from './auth.js'

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
  // The token → subject cache is process-wide; each test defines its own
  // permissions for the same 'test-token', so it must not leak between them.
  clearServerSubjectCache()
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

describe('users routes', () => {
  function makeUsersDb(permissions: string[]) {
    const roles = [{ user_id: 'u1', role: 'super_admin' }]
    const roleChain = {
      // `select()` is used two ways: awaited directly (the users service lists
      // every row) and chained `.eq().maybeSingle()` (auth resolves the actor's
      // own role). The thenable-with-methods shape serves both.
      select: vi.fn(() => Object.assign(Promise.resolve({ data: roles, error: null }), {
        eq: (_col: string, id: string) => ({
          maybeSingle: async () => ({ data: roles.find((r) => r.user_id === id) ?? null, error: null }),
        }),
      })),
      upsert: vi.fn(async (row: { user_id: string; role: string }) => { roles.push(row); return { error: null } }),
      delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    }
    return {
      from: vi.fn(() => roleChain),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'actor', app_metadata: { permissions } } }, error: null }),
        admin: {
          listUsers: vi.fn(async () => ({ data: { users: [{ id: 'u1', email: 'root@example.com' }, { id: 'u2', email: 'x@example.com' }] }, error: null })),
          inviteUserByEmail: vi.fn(async (email: string) => ({ data: { user: { id: 'u3', email } }, error: null })),
        },
      },
      roles,
    }
  }

  async function startUsersServer(permissions: string[]) {
    const db = makeUsersDb(permissions)
    const server = createServer(createSettingsHttpHandler(db as never, { corsOrigin: '*', previewTokenSecret: 'secret', inviteRedirectTo: 'https://cms.example/admin' }))
    activeServer = server
    await new Promise<void>((resolve) => { server.listen(0, () => resolve()) })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Failed to bind test server')
    return { db, baseUrl: `http://127.0.0.1:${address.port}` }
  }

  const auth = { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }

  it('requires users.manage — settings.manage alone is not enough', async () => {
    const { baseUrl } = await startUsersServer(['settings.manage'])
    const response = await fetch(`${baseUrl}/api/users`, { headers: auth })
    expect(response.status).toBe(403)
  })

  it('lists users with roles for a users.manage holder', async () => {
    const { baseUrl } = await startUsersServer(['users.manage'])
    const response = await fetch(`${baseUrl}/api/users`, { headers: auth })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.items).toEqual([
      expect.objectContaining({ id: 'u1', email: 'root@example.com', role: 'super_admin' }),
      expect.objectContaining({ id: 'u2', email: 'x@example.com', role: null }),
    ])
  })

  it('sets a role and rejects unknown roles', async () => {
    const { baseUrl, db } = await startUsersServer(['users.manage'])
    const ok = await fetch(`${baseUrl}/api/users/u2/role`, { method: 'PUT', headers: auth, body: JSON.stringify({ role: 'editor' }) })
    expect(ok.status).toBe(200)
    expect(db.roles).toContainEqual({ user_id: 'u2', role: 'editor' })

    const bad = await fetch(`${baseUrl}/api/users/u2/role`, { method: 'PUT', headers: auth, body: JSON.stringify({ role: 'overlord' }) })
    expect(bad.status).toBe(400)
  })

  it('returns 409 when the change would remove the last super_admin', async () => {
    const { baseUrl } = await startUsersServer(['users.manage'])
    const response = await fetch(`${baseUrl}/api/users/u1/role`, { method: 'PUT', headers: auth, body: JSON.stringify({ role: null }) })
    expect(response.status).toBe(409)
  })

  it('invites a user with a role, using the configured redirect', async () => {
    const { baseUrl, db } = await startUsersServer(['users.manage'])
    const response = await fetch(`${baseUrl}/api/users/invite`, { method: 'POST', headers: auth, body: JSON.stringify({ email: 'new@example.com', role: 'author' }) })
    const payload = await response.json()
    expect(response.status).toBe(201)
    expect(payload.item).toMatchObject({ id: 'u3', email: 'new@example.com', role: 'author' })
    expect(db.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('new@example.com', { redirectTo: 'https://cms.example/admin' })
  })
})

describe('delivery routes for pages, projects and site', () => {
  it('serves published pages, projects and site settings without auth', async () => {
    const { baseUrl } = await startTestServer()
    for (const path of ['/api/content/pages', '/api/content/projects']) {
      const response = await fetch(`${baseUrl}${path}`)
      expect(response.status, path).toBe(200)
      expect((await response.json()).items).toHaveLength(1)
    }
    for (const path of ['/api/content/pages/about', '/api/content/projects/hello-world', '/api/content/site']) {
      const response = await fetch(`${baseUrl}${path}`)
      expect(response.status, path).toBe(200)
      expect((await response.json()).item).toBeTruthy()
    }
  })

  it('rejects a malformed slug with 400', async () => {
    const { baseUrl } = await startTestServer()
    const response = await fetch(`${baseUrl}/api/content/pages/Not%20A%20Slug`)
    expect(response.status).toBe(400)
  })
})
