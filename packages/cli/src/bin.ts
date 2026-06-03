#!/usr/bin/env node
/**
 * `imba` CLI — the internal update engine for projects built on IMBA-CMS.
 *
 * Commands:
 *   imba update [--to <tag>] [--dry-run] [--force]
 *   imba doctor
 *   imba --help | -h
 *
 * `--help` and `doctor` must work with no DB/git env. A destructive block during
 * `update` (without --force) prints a clear message and exits 1.
 */

import { runUpdate, runDoctor } from './update.js'
import { createRealIO } from './io.js'

const USAGE = `imba — IMBA-CMS update engine

Usage:
  imba update [--to <tag>] [--dry-run] [--force]   Pull managed-package updates
  imba doctor                                      Read-only health report
  imba --help | -h                                 Show this help

Update flags:
  --to <tag>    Update to a specific git tag (default: latest available)
  --dry-run     Show the plan without applying anything
  --force       Allow destructive (non-additive) migrations (may alter data)

The update engine only ever touches MANAGED packages (@imba/core, @imba/ui,
@imba/tailwind-preset, @imba/plugin-*, @imba/template-*). Your app, your own
template/plugin packages, your createCMS config, and your content (DB rows) are
LOCAL and are never modified. Migrations are additive-only unless --force.
`

interface ParsedArgs {
  command: string | undefined
  to?: string
  dryRun: boolean
  force: boolean
  help: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { command: undefined, dryRun: false, force: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') args.help = true
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--force') args.force = true
    else if (a === '--to') {
      args.to = argv[++i]
    } else if (a.startsWith('--to=')) {
      args.to = a.slice('--to='.length)
    } else if (!a.startsWith('-') && args.command === undefined) {
      args.command = a
    }
  }
  return args
}

/**
 * Discover workspace package names for the doctor inventory. Best-effort and
 * dependency-free: if discovery fails we simply report an empty inventory.
 */
async function discoverPackageNames(): Promise<string[]> {
  try {
    const { readdir, readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const root = process.env.IMBA_MANAGED_DIR ?? process.cwd()
    const names: string[] = []
    for (const dir of ['packages', 'apps']) {
      let entries: string[] = []
      try {
        entries = await readdir(join(root, dir))
      } catch {
        continue
      }
      for (const entry of entries) {
        try {
          const raw = await readFile(join(root, dir, entry, 'package.json'), 'utf8')
          const pkg = JSON.parse(raw) as { name?: string }
          if (pkg.name) names.push(pkg.name)
        } catch {
          // skip non-package dirs
        }
      }
    }
    return names
  } catch {
    return []
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))

  if (args.help || args.command === undefined || args.command === 'help') {
    process.stdout.write(USAGE)
    return 0
  }

  const io = createRealIO()

  if (args.command === 'update') {
    const result = await runUpdate(
      { to: args.to, dryRun: args.dryRun, force: args.force },
      io,
    )
    if (result.blockedBy && result.blockedBy.length > 0) {
      // Message already logged by runUpdate via io.log; exit non-zero.
      return 1
    }
    return 0
  }

  if (args.command === 'doctor') {
    const packageNames = await discoverPackageNames()
    const report = await runDoctor(io, { packageNames })
    process.stdout.write(`IMBA-CMS doctor\n`)
    process.stdout.write(`  current version:  ${report.current}\n`)
    process.stdout.write(`  latest available: ${report.latest ?? 'unknown'}\n`)
    process.stdout.write(`  up to date:       ${report.upToDate ? 'yes' : 'no'}\n`)
    process.stdout.write(`  managed packages: ${report.inventory.managed.length}\n`)
    for (const name of report.inventory.managed) process.stdout.write(`    - ${name}\n`)
    process.stdout.write(`  local packages:   ${report.inventory.local.length}\n`)
    for (const name of report.inventory.local) process.stdout.write(`    - ${name}\n`)
    process.stdout.write(`  pending migrations: ${report.pendingCount}\n`)
    if (report.destructive.length > 0) {
      process.stdout.write(`  destructive blockers:\n`)
      for (const d of report.destructive) {
        process.stdout.write(`    - ${d.id}: ${d.reasons.join(', ')}\n`)
      }
    }
    return 0
  }

  process.stderr.write(`Unknown command: ${args.command}\n\n`)
  process.stdout.write(USAGE)
  return 1
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((err: unknown) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exitCode = 1
  })
