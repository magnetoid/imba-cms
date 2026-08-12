import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

/**
 * Runs the real migrations against a real Postgres.
 *
 * Everything the suite previously asserted about RLS was `expect(sql).toMatch(...)`
 * against SQL **text** — those tests pass on SQL that never executes. This
 * harness is what makes the capability model, the ownership predicates and the
 * draft-visibility boundary actually verified rather than merely spelled
 * correctly.
 *
 * Gated on IMBA_TEST_DATABASE_URL so the unit suite stays Postgres-free.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

export const TEST_DATABASE_URL = process.env.IMBA_TEST_DATABASE_URL
export const hasTestDatabase = Boolean(TEST_DATABASE_URL)

export interface Migration {
  id: string
  sql: string
}

export function readShim(): string {
  return readFileSync(join(HERE, 'supabase-shim.sql'), 'utf8')
}

export async function connect(): Promise<Client> {
  if (!TEST_DATABASE_URL) throw new Error('IMBA_TEST_DATABASE_URL is not set')
  const client = new Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  return client
}

/** Drops and recreates `public`, giving each test a clean database. */
export async function resetSchema(client: Client): Promise<void> {
  await client.query('drop schema if exists public cascade')
  await client.query('drop schema if exists auth cascade')
  await client.query('create schema public')
  await client.query(readShim())
}

/**
 * Applies migrations in order, recording each in `schema_migrations` the way
 * the update engine does.
 *
 * `recordApplied` mirrors the CLI's runner, which inserts the bookkeeping row in
 * the same transaction as the migration body.
 */
export async function applyMigrations(
  client: Client,
  migrations: Migration[],
  options: { recordApplied?: boolean } = {},
): Promise<void> {
  const record = options.recordApplied ?? true

  for (const migration of migrations) {
    await client.query('begin')
    try {
      await client.query(migration.sql)
      if (record) {
        await client.query(
          `insert into schema_migrations (id) values ($1) on conflict do nothing`,
          [migration.id],
        )
      }
      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw new Error(`Migration ${migration.id} failed: ${(error as Error).message}`)
    }
  }
}

export interface ActorClaims {
  sub?: string
  role?: string
  email?: string
  app_metadata?: Record<string, unknown>
}

/**
 * Runs `fn` as a PostgREST-style request: inside a transaction, with the
 * request role set and the JWT claims populated, then rolled back.
 *
 * The rollback is what keeps tests independent. The `set local role` is what
 * makes them mean anything at all — the connection owner is the database
 * superuser and is **exempt from RLS**, so an assertion made outside this
 * wrapper passes vacuously no matter what the policy says.
 */
export async function asRole<T>(
  client: Client,
  role: 'anon' | 'authenticated' | 'service_role',
  claims: ActorClaims | null,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  await client.query('begin')
  try {
    await client.query(`set local role ${role}`)
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ role, ...(claims ?? {}) }),
    ])
    return await fn(client)
  } finally {
    await client.query('rollback')
  }
}

/** Creates an auth user and, optionally, its cms_user_roles row. */
export async function createUser(
  client: Client,
  options: { email: string; role?: string; appMetadata?: Record<string, unknown> },
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `insert into auth.users (email, raw_app_meta_data) values ($1, $2) returning id`,
    [options.email, JSON.stringify(options.appMetadata ?? {})],
  )
  const id = rows[0]!.id

  if (options.role) {
    await client.query(`insert into cms_user_roles (user_id, role) values ($1, $2)`, [
      id,
      options.role,
    ])
  }

  return id
}

/** True when the thunk raises a Postgres insufficient-privilege / RLS error. */
export async function isDenied(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return false
  } catch (error) {
    const code = (error as { code?: string }).code
    const message = (error as Error).message ?? ''
    return code === '42501' || /row-level security|permission denied/i.test(message)
  }
}
