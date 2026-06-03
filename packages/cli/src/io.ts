/**
 * Real `UpdateIO` implementation. This is the thin, side-effecting seam between
 * the pure orchestrator and the outside world (git, pnpm, the filesystem, the
 * DB). It is intentionally NOT unit-tested — the testable logic lives in the
 * pure modules and the orchestrator (tested with fakes).
 *
 * Resolution defaults (override via env):
 *   - IMBA_MANAGED_DIR  : the pinned upstream checkout that holds the managed
 *                         packages. Defaults to process.cwd(). `git` + `pnpm`
 *                         run here, and `.imba/version.json` lives under it.
 *   - IMBA_DB_CONTAINER : the Supabase DB container name for `docker exec psql`
 *                         (mirrors scripts/migrate.sh). If unset, migration
 *                         apply is a no-op and reports nothing applied, so
 *                         `doctor`/`--help` never require DB env.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { UpdateIO } from './update.js'
import type { MigrationLike } from './safety.js'

const exec = promisify(execFile)

function managedDir(): string {
  return process.env.IMBA_MANAGED_DIR ?? process.cwd()
}

function versionFile(): string {
  return join(managedDir(), '.imba', 'version.json')
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await exec('git', ['-C', managedDir(), ...args])
  return stdout.trim()
}

export interface RealIOOptions {
  /** Inject a collector for managed migrations (the app composes these). */
  collectManagedMigrations?: () => Promise<MigrationLike[]>
  /** Inject a fetcher for applied ids (queries schema_migrations). */
  appliedMigrationIds?: () => Promise<string[]>
  /** Inject the migration runner (applies SQL; e.g. docker-exec psql). */
  applyMigrations?: (pending: MigrationLike[]) => Promise<string[]>
  /** Override the logger (defaults to console.log). */
  log?: (msg: string) => void
}

/**
 * Construct the real IO. Migration-related seams are injectable so the host app
 * can wire its own composed migration list / DB runner (mirroring
 * scripts/migrate.sh) without this package taking a hard DB dependency.
 */
export function createRealIO(opts: RealIOOptions = {}): UpdateIO {
  const log = opts.log ?? ((msg: string) => console.log(msg))

  return {
    async listTags() {
      try {
        const out = await git(['tag', '-l'])
        return out ? out.split(/\r?\n/).filter(Boolean) : []
      } catch {
        return []
      }
    },

    async currentVersion() {
      // Prefer the explicit stamp written by previous updates.
      try {
        const raw = await readFile(versionFile(), 'utf8')
        const parsed = JSON.parse(raw) as { version?: string; tag?: string }
        const v = parsed.version ?? parsed.tag
        if (typeof v === 'string' && v.length > 0) return v
      } catch {
        // fall through to git describe
      }
      // Fallback: nearest tag in the managed checkout.
      try {
        return await git(['describe', '--tags', '--abbrev=0'])
      } catch {
        return 'unknown'
      }
    },

    async collectManagedMigrations() {
      if (opts.collectManagedMigrations) return opts.collectManagedMigrations()
      // No app-composed list wired: report none rather than guessing.
      return []
    },

    async appliedMigrationIds() {
      if (opts.appliedMigrationIds) return opts.appliedMigrationIds()
      // No DB runner wired: report none. Keeps doctor usable without DB env.
      return []
    },

    async checkout(tag: string) {
      await git(['checkout', tag])
    },

    async install() {
      await exec('pnpm', ['install'], { cwd: managedDir() })
    },

    async applyMigrations(pending: MigrationLike[]) {
      if (opts.applyMigrations) return opts.applyMigrations(pending)
      // No DB runner wired: nothing applied.
      return []
    },

    async writeVersion(tag: string) {
      const file = versionFile()
      await mkdir(dirname(file), { recursive: true })
      const body = JSON.stringify({ version: tag, updatedAt: new Date().toISOString() }, null, 2)
      await writeFile(file, body + '\n', 'utf8')
    },

    log,
  }
}
