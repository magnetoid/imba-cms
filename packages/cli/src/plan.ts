/**
 * Update planner. Given a current version, a target version, the set of managed
 * migrations available at the target, and the ids already applied to the DB,
 * compute exactly what an update WOULD do — without performing any side effect.
 *
 * Pending migrations are derived via `@imba/core`'s `planMigrations` so the CLI
 * and the app share one source of truth for "what's not yet applied".
 */

import { isDestructiveSql, type DestructiveMigration, type MigrationLike } from './safety.js'
import { parseTag, compareVersions } from './version.js'

/**
 * Mirror of `@imba/core`'s `planMigrations` (see
 * `packages/core/src/cli/migrate.ts`): returns the migrations whose ids are not
 * yet recorded as applied. It is reimplemented here — rather than imported from
 * `@imba/core` — purely so the standalone `imba` binary stays loadable by Node.
 *
 * `@imba/core` ships its raw `src` (no build, extensionless ESM imports written
 * for bundler resolution), so it cannot be resolved by Node at runtime; pulling
 * it into the CLI's module graph would break `imba --help` / `imba doctor`. This
 * function is a trivial, pure filter and is kept byte-identical in behavior to
 * core's; `plan.test.ts` covers it.
 */
function planMigrations(all: MigrationLike[], applied: string[]): MigrationLike[] {
  const done = new Set(applied)
  return all.filter((m) => !done.has(m.id))
}

export interface PlanUpdateInput {
  current: string
  target: string
  managedMigrations: MigrationLike[]
  appliedIds: string[]
}

export interface UpdatePlan {
  from: string
  to: string
  pending: MigrationLike[]
  destructive: DestructiveMigration[]
  /** true when one or more pending migrations are destructive (blocks unless --force). */
  blocked: boolean
  /** true when current >= target (nothing to do). */
  upToDate: boolean
}

/**
 * Build an update plan. Pure: no IO, no mutation.
 */
export function planUpdate(input: PlanUpdateInput): UpdatePlan {
  const { current, target, managedMigrations, appliedIds } = input

  // What migrations are not yet applied at the target.
  const pending = planMigrations(managedMigrations, appliedIds)

  // Which of those would perform destructive DB operations.
  const destructive: DestructiveMigration[] = []
  for (const m of pending) {
    const scan = isDestructiveSql(m.sql)
    if (scan.destructive) destructive.push({ id: m.id, reasons: scan.reasons })
  }

  // Up-to-date when current >= target. If either tag is unparseable we cannot
  // prove we're ahead, so treat as NOT up-to-date (let the rest of the plan run).
  const cur = parseTag(current)
  const tgt = parseTag(target)
  const upToDate = cur !== null && tgt !== null && compareVersions(cur, tgt) >= 0

  return {
    from: current,
    to: target,
    pending,
    destructive,
    blocked: destructive.length > 0,
    upToDate,
  }
}
