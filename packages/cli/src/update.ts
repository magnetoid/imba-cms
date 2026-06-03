/**
 * Update orchestrator.
 *
 * The orchestrator is written against an injected `UpdateIO` interface so it can
 * be unit-tested with fakes and — crucially — so the set of side effects it is
 * even CAPABLE of performing is fixed and auditable. There is deliberately NO
 * method on `UpdateIO` that touches the consumer's app, their `createCMS`
 * config, their custom template/plugin packages, or their content (DB rows).
 * The only mutations possible are: advancing the managed git checkout,
 * installing deps, applying additive migrations, and writing the version stamp.
 */

import { planUpdate, type UpdatePlan } from './plan.js'
import { latestTag } from './version.js'
import { inventory, type Inventory } from './classify.js'
import type { DestructiveMigration, MigrationLike } from './safety.js'

export interface UpdateIO {
  /** All available release tags from the managed checkout (e.g. `git tag -l`). */
  listTags(): Promise<string[]>
  /** Current version: from `.imba/version.json` or the managed checkout's tag. */
  currentVersion(): Promise<string>
  /** All managed migrations available at the target. */
  collectManagedMigrations(): Promise<MigrationLike[]>
  /** Migration ids already applied to the DB (from schema_migrations). */
  appliedMigrationIds(): Promise<string[]>
  /** Advance the managed checkout to the given tag. */
  checkout(tag: string): Promise<void>
  /** Install dependencies (pnpm install). */
  install(): Promise<void>
  /** Apply the pending (additive) migrations; returns the ids applied. */
  applyMigrations(pending: MigrationLike[]): Promise<string[]>
  /** Persist the new version stamp (e.g. `.imba/version.json`). */
  writeVersion(tag: string): Promise<void>
  /** Log a human-readable line. */
  log(msg: string): void
}

export interface UpdateOptions {
  to?: string
  dryRun?: boolean
  force?: boolean
}

export interface UpdateResult {
  updated: boolean
  from: string
  to: string
  appliedMigrationIds: string[]
  blockedBy?: DestructiveMigration[]
}

/**
 * Run an update. Resolves the target tag, plans the migrations, enforces the
 * additive-only guarantee, and (unless dry-run / blocked / up-to-date) advances
 * the managed checkout, installs, applies migrations and stamps the version.
 *
 * Never throws on a destructive block — it reports cleanly via `blockedBy` so
 * the CLI can print a friendly message and exit non-zero itself.
 */
export async function runUpdate(opts: UpdateOptions, io: UpdateIO): Promise<UpdateResult> {
  const from = await io.currentVersion()
  const tags = await io.listTags()

  // Resolve target: explicit --to, else the latest available tag.
  const target = opts.to ?? latestTag(tags) ?? from

  const empty: UpdateResult = {
    updated: false,
    from,
    to: target,
    appliedMigrationIds: [],
  }

  const managedMigrations = await io.collectManagedMigrations()
  const appliedIds = await io.appliedMigrationIds()
  const plan: UpdatePlan = planUpdate({
    current: from,
    target,
    managedMigrations,
    appliedIds,
  })

  if (plan.upToDate) {
    io.log(`Already up to date at ${from} (target ${target}). Nothing to do.`)
    return empty
  }

  if (plan.blocked && !opts.force) {
    io.log(`Update from ${from} to ${target} is BLOCKED by destructive migration(s):`)
    for (const d of plan.destructive) {
      io.log(`  - ${d.id}: ${d.reasons.join(', ')}`)
    }
    io.log('Updates are additive-only. Re-run with --force to override (this may alter data).')
    return { ...empty, blockedBy: plan.destructive }
  }

  io.log(`Plan: ${from} -> ${target}`)
  io.log(`  pending migrations: ${plan.pending.length}`)
  if (plan.destructive.length > 0) {
    io.log(`  destructive (forced): ${plan.destructive.map((d) => d.id).join(', ')}`)
  }

  if (opts.dryRun) {
    io.log('Dry run: no changes applied.')
    return empty
  }

  // --- Mutating phase. Only managed surfaces are touched. ---
  io.log(`Checking out ${target}...`)
  await io.checkout(target)

  io.log('Installing dependencies...')
  await io.install()

  io.log(`Applying ${plan.pending.length} migration(s)...`)
  const appliedMigrationIds = await io.applyMigrations(plan.pending)

  io.log(`Writing version stamp ${target}...`)
  await io.writeVersion(target)

  io.log(`Updated ${from} -> ${target}.`)
  return {
    updated: true,
    from,
    to: target,
    appliedMigrationIds,
  }
}

export interface DoctorInput {
  /** All workspace package names to classify. */
  packageNames: string[]
  /** Names to force-classify as local (consumer overrides). */
  localOverrides?: string[]
}

export interface DoctorReport {
  current: string
  latest: string | null
  upToDate: boolean
  inventory: Inventory
  pendingCount: number
  destructive: DestructiveMigration[]
}

/**
 * Read-only health check. Reports the current version, latest available tag,
 * the managed/local package inventory, the count of pending migrations, and any
 * destructive blockers. Performs no mutation.
 */
export async function runDoctor(io: UpdateIO, input: DoctorInput): Promise<DoctorReport> {
  const current = await io.currentVersion()
  const tags = await io.listTags()
  const latest = latestTag(tags)
  const target = latest ?? current

  const managedMigrations = await io.collectManagedMigrations()
  const appliedIds = await io.appliedMigrationIds()
  const plan = planUpdate({
    current,
    target,
    managedMigrations,
    appliedIds,
  })

  return {
    current,
    latest,
    upToDate: plan.upToDate,
    inventory: inventory(input.packageNames, input.localOverrides),
    pendingCount: plan.pending.length,
    destructive: plan.destructive,
  }
}
