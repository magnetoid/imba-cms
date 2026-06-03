/**
 * Public surface of `@imba/cli`. Re-exports the pure modules plus the
 * orchestrator entrypoints so the package can be consumed programmatically as
 * well as via the `imba` binary.
 */

export {
  parseTag,
  compareVersions,
  latestTag,
  tagsBetween,
  type ParsedVersion,
} from './version.js'

export {
  isDestructiveSql,
  assertAdditive,
  type DestructiveScan,
  type DestructiveMigration,
  type MigrationLike,
} from './safety.js'

export {
  MANAGED_PACKAGES,
  classifyPackage,
  inventory,
  type Classification,
  type Inventory,
} from './classify.js'

export { planUpdate, type PlanUpdateInput, type UpdatePlan } from './plan.js'

export {
  runUpdate,
  runDoctor,
  type UpdateIO,
  type UpdateOptions,
  type UpdateResult,
  type DoctorInput,
  type DoctorReport,
} from './update.js'

export { createRealIO, type RealIOOptions } from './io.js'
