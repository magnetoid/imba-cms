import type { MigrationDef } from '../types'

export function planMigrations(all: MigrationDef[], applied: string[]): MigrationDef[] {
  const done = new Set(applied)
  return all.filter((m) => !done.has(m.id))
}

// applyMigrations is intentionally not unit-tested (it shells out to docker).
// It reads the composed list from the app, queries schema_migrations, and applies
// each pending migration via `docker exec <supabase-db> psql`. This mirrors the
// existing scripts/migrate.sh mechanism (container discovery via COOLIFY_APP_ID).
export interface ApplyOptions {
  container: string
  all: MigrationDef[]
  exec: (sql: string) => Promise<void>
  fetchApplied: () => Promise<string[]>
  record: (id: string) => Promise<void>
  dryRun?: boolean
}

export async function applyMigrations(opts: ApplyOptions): Promise<string[]> {
  const applied = await opts.fetchApplied()
  const pending = planMigrations(opts.all, applied)
  for (const m of pending) {
    if (opts.dryRun) continue
    await opts.exec(m.sql)
    await opts.record(m.id)
  }
  return pending.map((m) => m.id)
}
